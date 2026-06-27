import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUp, Image as ImageIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/create/extract")({
  head: () => ({ meta: [{ title: "Extractor — Betty" }] }),
  component: ExtractorPage,
});

function ExtractorPage() {
  const [v, setV] = useState("");
  return (
    <AppShell>
      <div className="min-h-[calc(100vh-3.5rem)] grid place-items-center px-6">
        <div className="w-full max-w-[760px]">
          <div className="text-center">
            <div className="mx-auto size-9 rounded-full bg-surface grid place-items-center">
              {/* avocado-ish emoji icon proxy */}
              <span className="text-[16px]">🥑</span>
            </div>
            <h1 className="mt-4 text-[26px] font-semibold tracking-tight">Extract a Prompt</h1>
            <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
              We'll analyze and guess the prompt<br />used to generate an image or a video
            </p>
          </div>

          <div className="mt-8 rounded-2xl bg-surface/60 border border-border/60 backdrop-blur p-4 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.7)]">
            <div className="flex items-start gap-3">
              <textarea
                value={v}
                onChange={(e) => setV(e.target.value)}
                placeholder="Upload an image or video, or paste a URL: https://www.instagram.com/reel/… https://www.tiktok.com/…"
                className="flex-1 min-h-[64px] max-h-40 bg-transparent text-[13.5px] resize-none focus:outline-none placeholder:text-muted-foreground/70 leading-relaxed"
              />
              <button
                className="size-9 rounded-full bg-surface-hover grid place-items-center text-foreground/80 hover:bg-surface disabled:opacity-40"
                disabled={!v.trim()}
                aria-label="Submit"
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-border/60">
              <button className="h-8 px-2.5 rounded-md text-[12.5px] text-muted-foreground hover:text-foreground hover:bg-surface-hover flex items-center gap-2">
                <ImageIcon className="size-3.5" /> Select media from library
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
