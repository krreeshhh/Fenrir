"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";

// Deterministic color from name — always consistent for same person
const PALETTE = [
   ["bg-violet-500", "text-white"],
   ["bg-blue-500", "text-white"],
   ["bg-cyan-500", "text-white"],
   ["bg-emerald-500", "text-white"],
   ["bg-amber-500", "text-white"],
   ["bg-rose-500", "text-white"],
   ["bg-pink-500", "text-white"],
   ["bg-indigo-500", "text-white"],
   ["bg-teal-500", "text-white"],
   ["bg-orange-500", "text-white"],
];

function getColor(name: string) {
   let hash = 0;
   for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
   return PALETTE[Math.abs(hash) % PALETTE.length];
}

interface AvatarProps {
   name: string;
   avatarUrl?: string | null;
   size?: "sm" | "md" | "lg" | "xl";
   className?: string;
}

const SIZE_MAP = {
   sm: "h-9 w-9 text-xs",
   md: "h-12 w-12 text-sm",
   lg: "h-16 w-16 text-xl",
   xl: "h-20 w-20 text-2xl",
};

const IMG_SIZE_MAP = {
   sm: "h-9 w-9",
   md: "h-12 w-12",
   lg: "h-16 w-16",
   xl: "h-20 w-20",
};

export function Avatar({ name, avatarUrl, size = "md", className }: AvatarProps) {
   const [imgError, setImgError] = useState(false);
   const [bg, fg] = getColor(name);

   const initials = name
      .split(" ")
      .map(w => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

   const showImage = avatarUrl && !imgError;

   if (showImage) {
      return (
         <div className={cn(
            "rounded-2xl shrink-0 overflow-hidden shadow-md",
            IMG_SIZE_MAP[size],
            className
         )}>
            <img
               src={avatarUrl}
               alt={name}
               className="w-full h-full object-cover"
               onError={() => setImgError(true)}
            />
         </div>
      );
   }

   return (
      <div className={cn(
         "rounded-2xl flex items-center justify-center font-black shrink-0 overflow-hidden shadow-md select-none",
         SIZE_MAP[size],
         bg,
         fg,
         className
      )}>
         {initials}
      </div>
   );
}

/** Rank badge: 🥇🥈🥉 emoji for top 3, number after */
export function RankBadge({ rank, large = false }: { rank: number; large?: boolean }) {
   if (rank === 1) return (
      <span className={cn("font-black", large ? "text-4xl" : "text-2xl")} title="1st Place">🥇</span>
   );
   if (rank === 2) return (
      <span className={cn("font-black", large ? "text-4xl" : "text-2xl")} title="2nd Place">🥈</span>
   );
   if (rank === 3) return (
      <span className={cn("font-black", large ? "text-4xl" : "text-2xl")} title="3rd Place">🥉</span>
   );
   return (
      <span className={cn(
         "font-black tabular-nums text-muted-foreground/40",
         large ? "text-2xl" : "text-sm w-6 text-center block"
      )}>
         {rank}
      </span>
   );
}
