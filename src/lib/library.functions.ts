import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TargetSchema = z.object({
  source: z.enum(["generation", "upload"]),
  id: z.string().uuid(),
});
type Target = z.infer<typeof TargetSchema>;

function tableFor(source: Target["source"]) {
  return source === "generation" ? "generations" : "assets";
}

export const listFolders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("folders")
      .select("id,name,parent_id,created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ name: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("folders")
      .insert({ user_id: context.userId, name: data.name })
      .select("id,name,parent_id,created_at").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const renameFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), name: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("folders").update({ name: data.name })
      .eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("folders").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    targets: z.array(TargetSchema).min(1),
    value: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const groups = { generation: [] as string[], upload: [] as string[] };
    for (const t of data.targets) groups[t.source].push(t.id);
    if (groups.generation.length) {
      const { error } = await context.supabase.from("generations")
        .update({ is_favorite: data.value }).in("id", groups.generation).eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    }
    if (groups.upload.length) {
      const { error } = await context.supabase.from("assets")
        .update({ is_favorite: data.value }).in("id", groups.upload).eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const moveToFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    targets: z.array(TargetSchema).min(1),
    folder_id: z.string().uuid().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const groups = { generation: [] as string[], upload: [] as string[] };
    for (const t of data.targets) groups[t.source].push(t.id);
    if (groups.generation.length) {
      const { error } = await context.supabase.from("generations")
        .update({ folder_id: data.folder_id }).in("id", groups.generation).eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    }
    if (groups.upload.length) {
      const { error } = await context.supabase.from("assets")
        .update({ folder_id: data.folder_id }).in("id", groups.upload).eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ targets: z.array(TargetSchema).min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const groups = { generation: [] as string[], upload: [] as string[] };
    for (const t of data.targets) groups[t.source].push(t.id);
    if (groups.generation.length) {
      const { error } = await context.supabase.from("generations")
        .delete().in("id", groups.generation).eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    }
    if (groups.upload.length) {
      const { error } = await context.supabase.from("assets")
        .delete().in("id", groups.upload).eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    }
    return { ok: true, count: data.targets.length };
  });
