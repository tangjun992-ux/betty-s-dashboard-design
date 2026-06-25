import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const FeedInput = z.object({
  kind: z.enum(["all", "image", "video", "audio"]).default("all"),
  cursor: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(40).default(24),
});

export const listPublicFeed = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => FeedInput.parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    let q = sb
      .from("generations")
      .select("id,kind,model,prompt,asset_url,thumb_url,like_count,created_at,user_id,width,height")
      .eq("status", "succeeded")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(data.limit + 1);
    if (data.kind !== "all") q = q.eq("kind", data.kind);
    if (data.cursor) q = q.lt("created_at", data.cursor);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const items = rows ?? [];
    const hasMore = items.length > data.limit;
    const page = hasMore ? items.slice(0, data.limit) : items;
    const nextCursor = hasMore ? page[page.length - 1].created_at : null;

    // Hydrate author handles
    const userIds = Array.from(new Set(page.map((r) => r.user_id)));
    let authors: Record<string, { handle: string | null; display_name: string | null; avatar_url: string | null }> = {};
    if (userIds.length) {
      const { data: profs } = await sb.from("profiles").select("id,handle,display_name,avatar_url").in("id", userIds);
      authors = Object.fromEntries((profs ?? []).map((p) => [p.id, { handle: p.handle, display_name: p.display_name, avatar_url: p.avatar_url }]));
    }
    return {
      items: page.map((r) => ({ ...r, author: authors[r.user_id] ?? null })),
      nextCursor,
    };
  });

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ generationId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("likes")
      .select("user_id")
      .eq("user_id", userId)
      .eq("generation_id", data.generationId)
      .maybeSingle();
    if (existing) {
      await supabase.from("likes").delete().eq("user_id", userId).eq("generation_id", data.generationId);
      await supabase.rpc as unknown; // noop placeholder; we manually decrement
      const { data: gen } = await supabase.from("generations").select("like_count").eq("id", data.generationId).maybeSingle();
      if (gen) await supabase.from("generations").update({ like_count: Math.max(0, (gen.like_count ?? 0) - 1) }).eq("id", data.generationId);
      return { liked: false };
    }
    const { error } = await supabase.from("likes").insert({ user_id: userId, generation_id: data.generationId });
    if (error) throw new Error(error.message);
    const { data: gen } = await supabase.from("generations").select("like_count").eq("id", data.generationId).maybeSingle();
    if (gen) await supabase.from("generations").update({ like_count: (gen.like_count ?? 0) + 1 }).eq("id", data.generationId);
    return { liked: true };
  });

export const listMyLikes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ generationIds: z.array(z.string().uuid()).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!data.generationIds.length) return { liked: [] as string[] };
    const { data: rows } = await context.supabase
      .from("likes")
      .select("generation_id")
      .eq("user_id", context.userId)
      .in("generation_id", data.generationIds);
    return { liked: (rows ?? []).map((r) => r.generation_id) };
  });

export const toggleFollow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Error("Can't follow yourself");
    const { data: existing } = await context.supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", context.userId)
      .eq("followee_id", data.userId)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("follows").delete().eq("follower_id", context.userId).eq("followee_id", data.userId);
      return { following: false };
    }
    await context.supabase.from("follows").insert({ follower_id: context.userId, followee_id: data.userId });
    return { following: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      display_name: z.string().min(1).max(60).optional(),
      handle: z.string().min(2).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
      bio: z.string().max(280).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyCreditHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("credits_ledger")
      .select("id,delta,reason,ref_id,created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
