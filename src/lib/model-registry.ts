// Central registry of generation models. UI uses this to render selectors
// and to constrain dependent params (aspect / duration / resolution / cost).
// Server functions cross-check the same registry so client can't request
// an unsupported combination.

export type Aspect = "1:1" | "16:9" | "9:16" | "4:5" | "4:3" | "3:4" | "21:9" | "3:2" | "2:3";
export type ImageQuality = "720p" | "1K" | "2K" | "4K";
export type VideoResolution = "480p" | "720p" | "1080p" | "4K";

export type ImageBadge =
  | { kind: "best"; label: string }       // pink "Best In Class"
  | { kind: "warn"; label: string }       // amber "Less restricted"
  | { kind: "info"; label: string };      // sky "New"

export type ImageFamilyIcon = "google" | "openai" | "bars" | "compass" | "flux" | "sparkle";

export interface ImageModel {
  id: string;             // upstream model id
  key: string;            // unique UI key
  label: string;          // display label
  vendor: "Google" | "OpenAI" | "ByteDance" | "xAI" | "Black Forest Labs";
  family: string;         // group key for ALL MODELS section
  familyLabel: string;
  familyIcon: ImageFamilyIcon;
  swatch?: string;
  badges?: ImageBadge[];
  featured?: boolean;
  bestInClass?: boolean;
  aspects: Aspect[];
  qualities: ImageQuality[];
  maxBatch: number;
  cost: number;           // credits per image
  endpoint: "chat" | "images";
  supportsEdit: boolean;
  highRes?: boolean;      // shows "High Res" chip
  description: string;
}

export type VideoBadge =
  | { kind: "best"; label: string }
  | { kind: "warn"; label: string }
  | { kind: "info"; label: string };

export interface VideoModel {
  id: string;             // fal model path
  key: string;
  label: string;
  vendor: "ByteDance" | "Kling" | "MiniMax" | "Google";
  family: string;
  familyLabel: string;
  familyIcon: "bars" | "compass" | "shuffle" | "google" | "openai" | "sparkle";
  swatch: string;
  badges?: VideoBadge[];
  featured?: boolean;
  speed?: string;
  framesTag?: "Start" | "Start/End";
  aspects: Aspect[];
  durations: number[];
  resolutions: VideoResolution[];
  cost: (dur: number, res: VideoResolution) => number;
  supportsStartFrame: boolean;
  supportsEndFrame: boolean;
  description: string;
}

// All image models share the same aspect grid in the Yapper UI.
const IMG_ASPECTS: Aspect[] = ["16:9", "3:2", "4:3", "1:1", "3:4", "2:3", "9:16"];

export const IMAGE_MODELS: ImageModel[] = [
  // ---------- BEST IN CLASS ----------
  {
    id: "openai/gpt-image-2", key: "gpt-image-2-high", label: "GPT Image 2 High Effort",
    vendor: "OpenAI", family: "gpt-image-2", familyLabel: "GPT Image 2", familyIcon: "openai",
    bestInClass: true, highRes: true,
    aspects: IMG_ASPECTS, qualities: ["1K", "2K", "4K"], maxBatch: 4, cost: 20,
    endpoint: "images", supportsEdit: true,
    description: "OpenAI's highest-effort image model for more detailed results.",
  },
  {
    id: "google/gemini-3-pro-image", key: "nano-banana-pro", label: "Nano Banana Pro",
    vendor: "Google", family: "nano-banana", familyLabel: "Nano Banana", familyIcon: "google",
    bestInClass: true, highRes: true,
    aspects: IMG_ASPECTS, qualities: ["1K", "2K", "4K"], maxBatch: 2, cost: 14,
    endpoint: "chat", supportsEdit: true,
    description: "Google's advanced image generation and editing model.",
  },
  // ---------- FEATURED ----------
  {
    id: "google/gemini-3.1-flash-image", key: "nano-banana-2", label: "Nano Banana 2",
    vendor: "Google", family: "nano-banana", familyLabel: "Nano Banana", familyIcon: "google",
    featured: true, highRes: true,
    aspects: IMG_ASPECTS, qualities: ["1K", "2K"], maxBatch: 4, cost: 12,
    endpoint: "chat", supportsEdit: true,
    description: "Google's latest and leading image model.",
  },
  {
    id: "openai/gpt-image-2", key: "gpt-image-2", label: "GPT Image 2",
    vendor: "OpenAI", family: "gpt-image-2", familyLabel: "GPT Image 2", familyIcon: "openai",
    featured: true, highRes: true,
    aspects: IMG_ASPECTS, qualities: ["720p", "1K", "2K", "4K"], maxBatch: 8, cost: 10,
    endpoint: "images", supportsEdit: true,
    description: "OpenAI's advanced image generation and editing model.",
  },
  {
    id: "google/gemini-2.5-flash-image", key: "seedream-v4-5", label: "Seedream-V4.5",
    vendor: "ByteDance", family: "seedream", familyLabel: "Seedream", familyIcon: "bars",
    featured: true, highRes: true,
    badges: [{ kind: "warn", label: "Less restricted" }],
    aspects: IMG_ASPECTS, qualities: ["1K", "2K"], maxBatch: 4, cost: 8,
    endpoint: "chat", supportsEdit: false,
    description: "ByteDance's advanced image generation model.",
  },
  {
    id: "openai/gpt-image-1-mini", key: "grok-image", label: "Grok Image",
    vendor: "xAI", family: "grok", familyLabel: "Grok Imagine", familyIcon: "compass",
    featured: true, highRes: true,
    aspects: IMG_ASPECTS, qualities: ["1K", "2K"], maxBatch: 4, cost: 6,
    endpoint: "images", supportsEdit: false,
    description: "xAI's image generation and editing model.",
  },
  // ---------- ALL MODELS — extras ----------
  {
    id: "google/gemini-2.5-flash-image", key: "nano-banana", label: "Nano Banana",
    vendor: "Google", family: "nano-banana", familyLabel: "Nano Banana", familyIcon: "google",
    aspects: IMG_ASPECTS, qualities: ["1K"], maxBatch: 4, cost: 5,
    endpoint: "chat", supportsEdit: true,
    description: "Cheapest & quickest Gemini image route.",
  },
  {
    id: "openai/gpt-image-1-mini", key: "gpt-image-1-mini", label: "GPT Image 1 Mini",
    vendor: "OpenAI", family: "gpt-image-2", familyLabel: "GPT Image 2", familyIcon: "openai",
    aspects: ["1:1", "16:9", "9:16"], qualities: ["1K"], maxBatch: 4, cost: 4,
    endpoint: "images", supportsEdit: false,
    description: "Cost-efficient OpenAI image generation.",
  },
  {
    id: "google/gemini-2.5-flash-image", key: "flux-1", label: "Flux 1.1",
    vendor: "Black Forest Labs", family: "flux", familyLabel: "Flux", familyIcon: "flux",
    aspects: IMG_ASPECTS, qualities: ["1K", "2K"], maxBatch: 4, cost: 7,
    endpoint: "chat", supportsEdit: false,
    description: "Black Forest Labs' Flux image model.",
  },
];

export const VIDEO_MODELS: VideoModel[] = [
  // --- Seedance family ---
  {
    id: "fal-ai/bytedance/seedance/v1/lite/text-to-video",
    key: "seedance-2-fast", label: "Seedance 2.0 Fast", vendor: "ByteDance",
    family: "seedance", familyLabel: "Seedance 2.0", familyIcon: "bars",
    swatch: "from-rose-400 to-fuchsia-500",
    featured: false, speed: "~20/s @720p", framesTag: "Start",
    aspects: ["21:9","16:9","4:3","1:1","3:4","9:16"],
    durations: [4,5,6,8,10,12,15], resolutions: ["480p","720p"],
    cost: (d, r) => Math.round((r === "720p" ? 20 : 14) * d),
    supportsStartFrame: true, supportsEndFrame: false,
    description: "Fast variant of ByteDance's video model with multi-modal input, lip sync, and multi-shot narrative.",
  },
  {
    id: "fal-ai/bytedance/seedance/v1/pro/text-to-video",
    key: "seedance-2", label: "Seedance 2.0", vendor: "ByteDance",
    family: "seedance", familyLabel: "Seedance 2.0", familyIcon: "bars",
    swatch: "from-pink-500 to-purple-600",
    featured: true, speed: "~22/s @720p",
    badges: [{ kind: "best", label: "Best Overall" }],
    aspects: ["21:9","16:9","4:3","1:1","3:4","9:16"],
    durations: [4,5,6,8,10,12,15], resolutions: ["720p","1080p","4K"],
    cost: (d, r) => Math.round((r === "4K" ? 50 : r === "1080p" ? 30 : 22) * d),
    supportsStartFrame: true, supportsEndFrame: true,
    description: "ByteDance's video model with multi-modal input, lip sync, and multi-shot narrative.",
  },
  {
    id: "fal-ai/bytedance/seedance/v1/pro/text-to-video",
    key: "seedance-2-open", label: "Seedance 2.0 Open", vendor: "ByteDance",
    family: "seedance", familyLabel: "Seedance 2.0", familyIcon: "bars",
    swatch: "from-fuchsia-500 to-rose-500",
    featured: true, speed: "~31/s @720p",
    badges: [{ kind: "warn", label: "Less restricted" }],
    aspects: ["21:9","16:9","4:3","1:1","3:4","9:16"],
    durations: [4,5,6,8,10,12,15], resolutions: ["720p","1080p"],
    cost: (d, r) => Math.round((r === "1080p" ? 38 : 31) * d),
    supportsStartFrame: true, supportsEndFrame: true,
    description: "Less-restricted variant of ByteDance's video model with multi-modal input, lip sync, and multi-shot narrative.",
  },
  // --- Kling family ---
  {
    id: "fal-ai/kling-video/v2/master/text-to-video",
    key: "kling-3", label: "Kling 3.0", vendor: "Kling",
    family: "kling", familyLabel: "Kling 3.0", familyIcon: "shuffle",
    swatch: "from-cyan-400 to-sky-500",
    featured: true, speed: "~18/s", framesTag: "Start/End",
    aspects: ["16:9","9:16","1:1"],
    durations: [4,5,6,8,10,12,15], resolutions: ["720p","1080p"],
    cost: (d, r) => Math.round((r === "1080p" ? 28 : 18) * d),
    supportsStartFrame: true, supportsEndFrame: true,
    description: "Great with reference start and end frames. Kling's latest and best video model.",
  },
  // --- Grok Imagine ---
  {
    id: "fal-ai/minimax/hailuo-02/standard/text-to-video",
    key: "grok-imagine-1-5", label: "Grok Imagine 1.5", vendor: "MiniMax",
    family: "grok", familyLabel: "Grok Imagine", familyIcon: "compass",
    swatch: "from-zinc-400 to-zinc-600",
    featured: true, speed: "~30/s @720p", framesTag: "Start",
    badges: [{ kind: "info", label: "New" }],
    aspects: ["16:9","9:16","1:1"],
    durations: [1,3,5,8,10,15], resolutions: ["720p","1080p"],
    cost: (d, r) => Math.round((r === "1080p" ? 40 : 30) * d),
    supportsStartFrame: true, supportsEndFrame: false,
    description: "xAI's Grok Imagine 1.5 image-to-video model with sound included.",
  },
];

export function findImageModel(id: string): ImageModel | undefined {
  return IMAGE_MODELS.find((m) => m.key === id) ?? IMAGE_MODELS.find((m) => m.id === id);
}
export function findVideoModel(id: string): VideoModel | undefined {
  return VIDEO_MODELS.find((m) => m.id === id);
}

export function groupImageModels() {
  const groups = new Map<string, { label: string; icon: ImageFamilyIcon; models: ImageModel[] }>();
  for (const m of IMAGE_MODELS) {
    const g = groups.get(m.family) ?? { label: m.familyLabel, icon: m.familyIcon, models: [] };
    g.models.push(m);
    groups.set(m.family, g);
  }
  return Array.from(groups.entries()).map(([key, v]) => ({ key, ...v }));
}

export function groupVideoModels() {
  const groups = new Map<string, { label: string; icon: VideoModel["familyIcon"]; models: VideoModel[] }>();
  for (const m of VIDEO_MODELS) {
    const g = groups.get(m.family) ?? { label: m.familyLabel, icon: m.familyIcon, models: [] };
    g.models.push(m);
    groups.set(m.family, g);
  }
  return Array.from(groups.entries()).map(([key, v]) => ({ key, ...v }));
}
