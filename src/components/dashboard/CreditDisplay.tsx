import { Link } from "@tanstack/react-router";
import { Coins, Plus } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

export function CreditDisplay({ credits, to = "/pricing" }: { credits: number; to?: string }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    const controls = animate(mv, credits, { duration: 0.6, ease: "easeOut" });
    return () => controls.stop();
  }, [credits, mv]);

  return (
    <Link
      to={to}
      aria-label={`${credits} credits — top up`}
      className="group h-9 pl-2.5 pr-1 rounded-full flex items-center gap-2 bg-surface/70 border border-border/60 hover:border-amber-400/40 hover:bg-surface-hover transition-colors"
    >
      <span className="size-5 rounded-full grid place-items-center bg-amber-500/15">
        <Coins className="size-3 text-amber-400" />
      </span>
      <motion.span className="text-[12.5px] font-semibold tabular-nums text-foreground">
        {rounded}
      </motion.span>
      <span className="ml-1 size-7 rounded-full grid place-items-center bg-amber-500/15 text-amber-300 group-hover:bg-amber-500/25 transition">
        <Plus className="size-3.5" />
      </span>
    </Link>
  );
}
