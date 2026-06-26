// Central registry of generation models. UI uses this to render selectors
// and to constrain dependent params (aspect / duration / resolution / cost).
// Server functions cross-check the same registry so client can't request
// an unsupported combination.

export type Aspect = "1:1" | "16:9" | "9:16" | "4:5" | "4:3" | "3:4" | "21:9";
export type ImageQuality = "1K" | "2K" | "4K";
export type VideoResolution = "480p" | "720p" | "1080p";

export interface ImageModel {
  id: string;             // gateway model id
  key: string;            // short ui key
  label: string;
  vendor: "Google" | "OpenAI";
  badge?: string;         // "Pro" / "Fast" / "New"
  swatch: string;         // tailwind gradient classes for dot
  aspects: Aspect[];
  qualities: ImageQuality[];
  maxBatch: number;
  cost: number;           // credits per image
  endpoint: "chat" | "images"; // routing in gateway
  supportsEdit: boolean;
  description: string;
}

export interface VideoModel {
  id: string;             // fal model path
  key: string;
  label: string;
  vendor: "ByteDance" | "Kling" | "MiniMax" | "Google";
  badge?: string;
  swatch: string;
  aspects: Aspect[];
  durations: number[];    // seconds
  resolutions: VideoResolution[];
  cost: (dur: number, res: VideoResolution) => number;
  supportsStartFrame: boolean;
  supportsEndFrame: boolean;
  description: string;
}

export const IMAGE_MODELS: ImageModel[] = [
  {
    id: "openai/gpt-image-2",
    key: "gpt-image-2",
    label: "GPT Image 2",
    vendor: "OpenAI",
    badge: "Pro",
    swatch: "from-emerald-400 to-teal-500",
    aspects: ["1:1", "16:9", "9:16", "4:3", "3:4"],
    qualities: ["1K", "2K"],
    maxBatch: 4,
    cost: 10,
    endpoint: "images",
    supportsEdit: true,
    description: "OpenAI flagship — best prompt adherence & typography.",
  },
  {
    id: "google/gemini-3.1-flash-image",
    key: "nano-banana-2",
    label: "Nano Banana 2",
    vendor: "Google",
    badge: "New",
    swatch: "from-amber-300 to-orange-500",
    aspects: ["1:1", "16:9", "9:16", "4:5", "3:4"],
    qualities: ["1K", "2K"],
    maxBatch: 4,
    cost: 8,
    endpoint: "chat",
    supportsEdit: true,
    description: "Fast Gemini 3.1 image with strong editing.",
  },
  {
    id: "google/gemini-3-pro-image",
    key: "gemini-3-pro-image",
    label: "Gemini 3 Pro Image",
    vendor: "Google",
    badge: "Pro",
    swatch: "from-violet-400 to-fuchsia-500",
    aspects: ["1:1", "16:9", "9:16", "4:5", "3:4", "21:9"],
    qualities: ["1K", "2K", "4K"],
    maxBatch: 2,
    cost: 14,
    endpoint: "chat",
    supportsEdit: true,
    description: "Higher-quality Gemini image generation/editing.",
  },
  {
    id: "google/gemini-2.5-flash-image",
    key: "nano-banana",
    label: "Nano Banana",
    vendor: "Google",
    badge: "Fast",
    swatch: "from-lime-300 to-emerald-500",
    aspects: ["1:1", "16:9", "9:16", "4:5"],
    qualities: ["1K"],
    maxBatch: 4,
    cost: 5,
    endpoint: "chat",
    supportsEdit: true,
    description: "Cheapest & quickest Gemini image route.",
  },
  {
    id: "openai/gpt-image-1-mini",
    key: "gpt-image-1-mini",
    label: "GPT Image 1 Mini",
    vendor: "OpenAI",
    badge: "Fast",
    swatch: "from-sky-400 to-blue-500",
    aspects: ["1:1", "16:9", "9:16"],
    qualities: ["1K"],
    maxBatch: 4,
    cost: 4,
    endpoint: "images",
    supportsEdit: false,
    description: "Cost-efficient OpenAI image generation.",
  },
];

export const VIDEO_MODELS: VideoModel[] = [
  {
    id: "fal-ai/bytedance/seedance/v1/lite/text-to-video",
    key: "seedance-lite",
    label: "Seedance Lite",
    vendor: "ByteDance",
    badge: "Fast",
    swatch: "from-rose-400 to-fuchsia-500",
    aspects: ["16:9", "9:16", "1:1"],
    durations: [5, 10],
    resolutions: ["480p", "720p"],
    cost: (d) => (d === 10 ? 80 : 50),
    supportsStartFrame: true,
    supportsEndFrame: false,
    description: "Fast Seedance text-to-video. Great cost/quality balance.",
  },
  {
    id: "fal-ai/bytedance/seedance/v1/pro/text-to-video",
    key: "seedance-pro",
    label: "Seedance 2.0 Pro",
    vendor: "ByteDance",
    badge: "Pro",
    swatch: "from-pink-500 to-purple-600",
    aspects: ["16:9", "9:16", "1:1"],
    durations: [5, 10],
    resolutions: ["720p", "1080p"],
    cost: (d, r) => (r === "1080p" ? (d === 10 ? 200 : 120) : (d === 10 ? 140 : 80)),
    supportsStartFrame: true,
    supportsEndFrame: true,
    description: "Higher-fidelity Seedance with end-frame control.",
  },
  {
    id: "fal-ai/kling-video/v2/master/text-to-video",
    key: "kling-2",
    label: "Kling 2.0 Master",
    vendor: "Kling",
    badge: "Pro",
    swatch: "from-cyan-400 to-sky-500",
    aspects: ["16:9", "9:16", "1:1"],
    durations: [5, 10],
    resolutions: ["1080p"],
    cost: (d) => (d === 10 ? 240 : 140),
    supportsStartFrame: true,
    supportsEndFrame: false,
    description: "Kling Master — cinematic motion, premium quality.",
  },
  {
    id: "fal-ai/minimax/hailuo-02/standard/text-to-video",
    key: "hailuo-02",
    label: "Hailuo 02",
    vendor: "MiniMax",
    swatch: "from-amber-400 to-rose-500",
    aspects: ["16:9", "9:16"],
    durations: [6, 10],
    resolutions: ["720p", "1080p"],
    cost: (d, r) => (r === "1080p" ? (d === 10 ? 180 : 110) : (d === 10 ? 120 : 70)),
    supportsStartFrame: true,
    supportsEndFrame: false,
    description: "MiniMax Hailuo — natural motion and strong realism.",
  },
];

export function findImageModel(id: string): ImageModel | undefined {
  return IMAGE_MODELS.find((m) => m.id === id);
}
export function findVideoModel(id: string): VideoModel | undefined {
  return VIDEO_MODELS.find((m) => m.id === id);
}
