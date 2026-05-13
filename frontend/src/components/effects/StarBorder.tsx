import React from "react";
import { cn } from "@/lib/utils";

interface StarBorderProps<T extends React.ElementType> {
  as?: T;
  className?: string;
  color?: string;
  speed?: string;
  thickness?: number;
  children?: React.ReactNode;
}

export default function StarBorder<T extends React.ElementType = "button">({
  as,
  className,
  color = "hsl(168,72%,42%)",
  speed = "5s",
  thickness = 2,
  children,
  ...rest
}: StarBorderProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof StarBorderProps<T>>) {
  const Component = as || "button";

  return (
    <Component
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-full border-0 bg-transparent cursor-pointer overflow-hidden",
        className
      )}
      style={{ padding: `${thickness}px` }}
      {...rest}
    >
      {/* Animated border layer */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{ borderRadius: "inherit" }}
      >
        <div
          className="absolute w-[300%] h-[50%] bottom-[-11%] right-[-250%] rounded-full animate-star-movement-bottom opacity-70"
          style={{
            background: `radial-gradient(circle, ${color}, transparent 10%)`,
            animationDuration: speed,
          }}
        />
        <div
          className="absolute w-[300%] h-[50%] top-[-10%] left-[-250%] rounded-full animate-star-movement-top opacity-70"
          style={{
            background: `radial-gradient(circle, ${color}, transparent 10%)`,
            animationDuration: speed,
          }}
        />
      </div>
      {/* Inner content */}
      <div
        className="relative z-[1] rounded-full w-full h-full flex items-center justify-center"
        style={{
          background: "hsl(210 35% 12%)",
          borderRadius: "inherit",
        }}
      >
        {children}
      </div>
    </Component>
  );
}
