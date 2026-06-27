import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** List user-uploaded assets (separate from AI generations). */
export const listMyAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("assets")
      .select("id,kind,url,thumb_url,file_size,mime_type,source,is_favorite,folder_id,created_at,metadata")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(120);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
