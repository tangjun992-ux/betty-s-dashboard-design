import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const NameRe = /^[a-z0-9_-]{2,32}$/i;

export const listElements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("elements")
      .select("id,name,image_url,thumb_url,description,created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const CreateInput = z.object({
  name: z.string().regex(NameRe, "Use 2-32 letters, numbers, _ or -"),
  description: z.string().max(500).optional(),
  filename: z.string().min(1).max(200),
  contentType: z.string().regex(/^image\//, "Must be an image"),
  dataBase64: z.string().min(10),
});

export const createElement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    if (bytes.byteLength > 10 * 1024 * 1024) throw new Error("Image must be ≤ 10MB");
    const ext = (data.filename.split(".").pop() || "png").toLowerCase();
    const path = `${userId}/elements/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("generations")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);
    const { data: signed } = await supabase.storage
      .from("generations")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    const url = signed?.signedUrl ?? null;

    const { data: row, error } = await supabase
      .from("elements")
      .insert({
        user_id: userId,
        name: data.name,
        description: data.description ?? null,
        image_url: url,
        thumb_url: url,
      })
      .select("id,name,image_url,thumb_url,description,created_at")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("An element with that name already exists");
      throw new Error(error.message);
    }
    return row;
  });

const RenameInput = z.object({
  id: z.string().uuid(),
  name: z.string().regex(NameRe, "Use 2-32 letters, numbers, _ or -"),
  description: z.string().max(500).optional(),
});

export const updateElement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RenameInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("elements")
      .update({ name: data.name, description: data.description ?? null, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) {
      if (error.code === "23505") throw new Error("An element with that name already exists");
      throw new Error(error.message);
    }
    return { ok: true };
  });

const DeleteInput = z.object({ id: z.string().uuid() });

export const deleteElement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DeleteInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("elements")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
