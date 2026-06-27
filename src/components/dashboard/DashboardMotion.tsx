"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

export function DashboardMotion({ children }: { children: ReactNode }) {
  // Wrap each direct child section with a motion item
  const arr = Array.isArray(children) ? children : [children];
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {arr.map((child, i) => (
        <motion.div key={i} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
