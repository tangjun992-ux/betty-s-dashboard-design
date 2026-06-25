import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles, Plus, Settings2, Feather, Sun, Wand2, FileText, MessagesSquare,
  Lightbulb, Music,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CreateHub, Composer, OptionPill } from "@/components/create/CreateHub";
import bannerInfluencers from "@/assets/banner-influencers.jpg";
import bannerTutorial from "@/assets/banner-tutorial.jpg";
import toolSeedance from "@/assets/tool-seedance.jpg";
import toolVideogen from "@/assets/tool-videogen.jpg";
import toolProduct from "@/assets/tool-product.jpg";

export const Route = createFileRoute("/create/agent")({
  head: () => ({ meta: [{ title: "Agent — Betty" }] }),
  component: AgentPage,
});

function AgentPage() {
  const [input, setInput] = useState("");

  return (
    <AppShell>
      <CreateHub
        title="What do you want to create?"
        chips={[
          { label: "Help Prompt", icon: Feather },
          { label: "Create Content", icon: FileText },
          { label: "Help Ideate", icon: Lightbulb },
          { label: "Generate Audio", icon: Music },
        ]}
        composer={
          <Composer
            placeholder="Help me outline"
            value={input}
            onChange={setInput}
            leading={
              <div className="flex flex-col gap-1.5">
                <button className="size-8 grid place-items-center rounded-md hover:bg-surface-hover text-muted-foreground" aria-label="Attach">
                  <Plus className="size-4" />
                </button>
                <button className="size-8 grid place-items-center rounded-md hover:bg-surface-hover text-muted-foreground" aria-label="Settings">
                  <Settings2 className="size-4" />
                </button>
              </div>
            }
            options={
              <>
                <OptionPill icon={Wand2} value="Prompt mode" />
                <OptionPill icon={Sun} value="Sonnet 4.6" />
              </>
            }
          />
        }
        appsTitle="Manual Apps"
        appsIcon={MessagesSquare}
        apps={[
          { image: toolSeedance, title: "Tokyo Street Style", tag: "Agent" },
          { image: toolProduct, title: "Coffee Mug Mock", tag: "Agent" },
          { image: bannerInfluencers, title: "Influencer Party", tag: "Agent" },
          { image: bannerTutorial, title: "Patriotic Address", tag: "Agent" },
          { image: toolVideogen, title: "Cat in the Window", tag: "Agent" },
        ]}
      />
      {/* Sparkles import retained for icon reuse */}
      <span className="hidden"><Sparkles /></span>
    </AppShell>
  );
}
