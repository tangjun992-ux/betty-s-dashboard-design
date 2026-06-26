import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MotionInput = z.object({
  videoPath: z.string().min(1),
  imagePath: z.string().min(1),
  prompt: z.string().max(2000).optional().default(""),
  orientation: z.enum(["Video", "Portrait", "Landscape", "Square"]).default("Video"),
  mode: z.enum(["Standard", "Pro"]).default("Standard"),
});

const MOTION_MODEL = "fal-ai/wan/v2.2-a14b/animate/move";

export const generateMotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => MotionInput.parse(d))
  .handler(async ({ data, context }) => {
    const falKey = process.env.FAL_KEY;
    if (!falKey) throw new Error("Motion service not configured (FAL_KEY missing)");
    const { supabase, userId } = context;

    const cost = data.mode === "Pro" ? 120 : 80;
    const { data: prof } = await supabase
      .from("profiles").select("credits").eq("id", userId).maybeSingle();
    if (!prof || prof.credits < cost) {
      throw new Error(`Need ${cost} credits to generate motion video.`);
    }

    // Verify paths are under user's folder
    if (!data.videoPath.startsWith(`${userId}/`) || !data.imagePath.startsWith(`${userId}/`)) {
      throw new Error("Invalid file path");
    }

    const [vSigned, iSigned] = await Promise.all([
      supabase.storage.from("generations").createSignedUrl(data.videoPath, 60 * 60),
      supabase.storage.from("generations").createSignedUrl(data.imagePath, 60 * 60),
    ]);
    const videoUrl = vSigned.data?.signedUrl;
    const imageUrl = iSigned.data?.signedUrl;
    if (!videoUrl || !imageUrl) throw new Error("Failed to access uploaded files");

    const { data: row, error: insErr } = await supabase
      .from("generations").insert({
        user_id: userId,
        kind: "motion",
        model: MOTION_MODEL,
        prompt: data.prompt,
        params: { orientation: data.orientation, mode: data.mode },
        status: "queued",
      }).select("id").single();
    if (insErr || !row) throw new Error(insErr?.message ?? "Failed to start motion job");

    const submit = await fetch(`https://queue.fal.run/${MOTION_MODEL}`, {
      method: "POST",
      headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        video_url: videoUrl,
        prompt: data.prompt || undefined,
      }),
    });
    if (!submit.ok) {
      const text = await submit.text();
      await supabase.from("generations").update({
        status: "failed", error: text.slice(0, 300),
      }).eq("id", row.id);
      throw new Error(`Motion provider error (${submit.status}): ${text.slice(0, 200)}`);
    }
    const submitJson = await submit.json() as { request_id?: string };
    const requestId = submitJson.request_id;
    if (!requestId) {
      await supabase.from("generations").update({ status: "failed", error: "no request_id" }).eq("id", row.id);
      throw new Error("Motion provider did not return a request id");
    }

    await supabase.from("credits_ledger").insert({
      user_id: userId, delta: -cost, reason: "motion", ref_id: row.id,
    });
    await supabase.from("profiles").update({ credits: prof.credits - cost }).eq("id", userId);

    await supabase.from("generations").update({
      status: "running",
      params: {
        orientation: data.orientation, mode: data.mode,
        request_id: requestId, provider: "fal", model_path: MOTION_MODEL, cost,
      },
    }).eq("id", row.id);

    return { id: row.id, cost };
  });

export const listMyMotion = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("generations")
      .select("id,status,asset_url,thumb_url,prompt,created_at,error")
      .eq("user_id", userId).eq("kind", "motion")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
