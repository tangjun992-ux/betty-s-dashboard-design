import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles, Plus, Settings2, Feather, FileText, MessagesSquare,
  Lightbulb, Music, ImagePlus, Upload, Loader2, User as UserIcon,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CreateHub, Composer } from "@/components/create/CreateHub";
import { AssistantSettings } from "@/components/create/AssistantSettings";
import { ModePill, ModelPill, type AgentMode, type AgentModel } from "@/components/create/AgentComposerPills";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { sendAgentMessage } from "@/lib/agent.functions";
import { useSession } from "@/lib/use-session";
import { useNavigate } from "@tanstack/react-router";
import bannerInfluencers from "@/assets/banner-influencers.jpg";
import bannerTutorial from "@/assets/banner-tutorial.jpg";
import toolSeedance from "@/assets/tool-seedance.jpg";
import toolVideogen from "@/assets/tool-videogen.jpg";
import toolProduct from "@/assets/tool-product.jpg";

export const Route = createFileRoute("/create/agent")({
  head: () => ({ meta: [{ title: "Agent — Betty" }] }),
  component: AgentPage,
});

type ChatMsg = { role: "user" | "assistant"; content: string };

function AgentPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const send = useServerFn(sendAgentMessage);
  const [input, setInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mode, setMode] = useState<AgentMode>("prompt");
  const [model, setModel] = useState<AgentModel>("sonnet-4.6");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function onSend() {
    if (!input.trim() || busy) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    try {
      const r = await send({ data: { sessionId, message: text } });
      setSessionId(r.sessionId);
      setMessages((m) => [...m, { role: "assistant", content: r.reply }]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send");
      setMessages((m) => m.slice(0, -1));
      setInput(text);
    } finally {
      setBusy(false);
    }
  }

  const composer = (
    <Composer
      placeholder={messages.length ? "Reply to Betty…" : "Help me outline"}
      value={input}
      onChange={setInput}
      onSubmit={onSend}
      busy={busy}
      leading={
        <div className="flex flex-col gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <button className="size-8 grid place-items-center rounded-md hover:bg-surface-hover text-muted-foreground" aria-label="Attach">
                <Plus className="size-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" sideOffset={8} className="w-[200px] p-1.5 rounded-xl bg-[#101013] border-border/60 shadow-2xl">
              <button className="w-full flex items-center gap-3 h-10 px-3 rounded-lg text-[13.5px] text-foreground hover:bg-surface-hover transition-colors">
                <ImagePlus className="size-4 text-muted-foreground" /> Select Media
              </button>
              <label className="w-full flex items-center gap-3 h-10 px-3 rounded-lg text-[13.5px] text-foreground hover:bg-surface-hover transition-colors cursor-pointer">
                <Upload className="size-4 text-muted-foreground" /> Upload File
                <input type="file" hidden />
              </label>
            </PopoverContent>
          </Popover>
          <button onClick={() => setSettingsOpen(true)} className="size-8 grid place-items-center rounded-md hover:bg-surface-hover text-muted-foreground" aria-label="Assistant Settings">
            <Settings2 className="size-4" />
          </button>
        </div>
      }
      options={<><ModePill mode={mode} onChange={setMode} /><ModelPill model={model} onChange={setModel} /></>}
    />
  );

  return (
    <AppShell>
      {messages.length === 0 ? (
        <CreateHub
          title="What do you want to create?"
          chips={[
            { label: "Help Prompt", icon: Feather },
            { label: "Create Content", icon: FileText },
            { label: "Help Ideate", icon: Lightbulb },
            { label: "Generate Audio", icon: Music },
          ]}

          composer={composer}
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
      ) : (
        <div className="flex flex-col h-[calc(100vh-56px)]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-[760px] mx-auto px-6 py-8 space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "assistant" && (
                    <div className="size-8 rounded-md bg-[image:var(--gradient-brand)] grid place-items-center shrink-0">
                      <Sparkles className="size-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-foreground text-background rounded-tr-sm"
                      : "bg-surface text-foreground rounded-tl-sm"
                  }`}>
                    {m.content}
                  </div>
                  {m.role === "user" && (
                    <div className="size-8 rounded-full bg-surface grid place-items-center shrink-0">
                      <UserIcon className="size-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {busy && (
                <div className="flex gap-3">
                  <div className="size-8 rounded-md bg-[image:var(--gradient-brand)] grid place-items-center shrink-0">
                    <Sparkles className="size-4 text-white" />
                  </div>
                  <div className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3 inline-flex items-center gap-2 text-[13px] text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" /> Thinking…
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-border/60 bg-background/80 backdrop-blur">
            <div className="max-w-[760px] mx-auto px-6 py-4">{composer}</div>
          </div>
        </div>
      )}
      <AssistantSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </AppShell>
  );
}
