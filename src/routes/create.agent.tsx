import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles, Plus, Settings2, Feather, FileText, MessagesSquare,
  Lightbulb, Music, ImagePlus, Upload,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CreateHub, Composer } from "@/components/create/CreateHub";
import { AssistantSettings } from "@/components/create/AssistantSettings";
import { ModePill, ModelPill, type AgentMode, type AgentModel } from "@/components/create/AgentComposerPills";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mode, setMode] = useState<AgentMode>("prompt");
  const [model, setModel] = useState<AgentModel>("sonnet-4.6");

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
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="size-8 grid place-items-center rounded-md hover:bg-surface-hover text-muted-foreground" aria-label="Attach">
                      <Plus className="size-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="start"
                    sideOffset={8}
                    className="w-[200px] p-1.5 rounded-xl bg-[#101013] border-border/60 shadow-2xl"
                  >
                    <button className="w-full flex items-center gap-3 h-10 px-3 rounded-lg text-[13.5px] text-foreground hover:bg-surface-hover transition-colors">
                      <ImagePlus className="size-4 text-muted-foreground" />
                      Select Media
                    </button>
                    <label className="w-full flex items-center gap-3 h-10 px-3 rounded-lg text-[13.5px] text-foreground hover:bg-surface-hover transition-colors cursor-pointer">
                      <Upload className="size-4 text-muted-foreground" />
                      Upload File
                      <input type="file" hidden />
                    </label>
                  </PopoverContent>
                </Popover>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="size-8 grid place-items-center rounded-md hover:bg-surface-hover text-muted-foreground"
                  aria-label="Assistant Settings"
                >
                  <Settings2 className="size-4" />
                </button>
              </div>
            }
            options={
              <>
                <ModePill mode={mode} onChange={setMode} />
                <ModelPill model={model} onChange={setModel} />
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
      <AssistantSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
      <span className="hidden"><Sparkles /></span>
    </AppShell>
  );
}
