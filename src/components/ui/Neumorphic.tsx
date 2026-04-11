import * as React from "react";
import { cn } from "@/src/lib/utils";
import { motion } from "motion/react";

interface NeuProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "extruded" | "depressed";
  size?: "sm" | "md";
}

export const NeuCard = React.forwardRef<HTMLDivElement, NeuProps>(
  ({ className, variant = "extruded", size = "md", ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={staggerItem}
        className={cn(
          variant === "extruded"
            ? size === "sm" ? "neu-extruded-sm" : "neu-extruded"
            : size === "sm" ? "neu-depressed-sm" : "neu-depressed",
          "rounded-[32px] p-6 transition-all duration-300",
          className
        )}
        {...props}
      />
    );
  }
);

interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg" | "xl";
  active?: boolean;
}

export const NeuButton = React.forwardRef<HTMLButtonElement, NeuButtonProps>(
  ({ className, size = "md", active = false, ...props }, ref) => {
    const hasWidth = className?.includes("w-");
    const hasHeight = className?.includes("h-");

    return (
      <button
        ref={ref}
        className={cn(
          "neu-button rounded-full flex items-center justify-center transition-all duration-300 font-bold",
          !hasWidth && (
            size === "sm" ? "w-10 h-10 px-0" : 
            size === "md" ? "w-16 h-16" : 
            size === "xl" ? "w-24 h-24" : "w-20 h-20"
          ),
          !hasHeight && (
            size === "sm" ? "h-10" : 
            size === "md" ? "h-16" : 
            size === "xl" ? "h-24" : "h-20"
          ),
          active && "neu-depressed text-accent-terracotta tact-glow",
          className
        )}
        {...props}
      />
    );
  }
);

export const NeuInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "neu-depressed-sm w-full rounded-2xl px-5 py-4 bg-transparent outline-none text-text-main placeholder:text-text-muted transition-all duration-300 focus:tact-border",
          className
        )}
        {...props}
      />
    );
  }
);

export const NeuTextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "neu-depressed-sm w-full rounded-2xl px-5 py-4 bg-transparent outline-none text-text-main placeholder:text-text-muted transition-all duration-300 focus:tact-border resize-none",
          className
        )}
        {...props}
      />
    );
  }
);

export const BentoCard = React.forwardRef<HTMLDivElement, NeuProps>(
  ({ className, variant = "extruded", size = "md", ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={staggerItem}
        whileHover={{ y: -8, scale: 1.01, transition: { type: "spring", stiffness: 300, damping: 20 } }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "neu-extruded rounded-[32px] p-8 flex flex-col gap-4 h-full border border-white/5 relative overflow-hidden group transition-shadow duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]",
          className
        )}
        {...props}
      />
    );
  }
);

// ─── Animation Variants ──────────────────────────────────────────────────────

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 1
    }
  },
};

export const DailyProgress = ({ count, max = 3 }: { count: number; max?: number }) => {
  return (
    <div className="flex gap-4 justify-center items-center">
      {Array.from({ length: max }).map((_, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{
            scale: i < count ? 1.2 : 1,
            backgroundColor: i < count ? "var(--color-accent-terracotta)" : "rgba(255,255,255,0.05)",
          }}
          className={cn(
            "w-4 h-4 rounded-full transition-all duration-300",
            i < count 
              ? "tact-glow shadow-[0_0_10px_rgba(217,119,87,0.5)]" 
              : "neu-depressed-sm"
          )}
        />
      ))}
    </div>
  );
};
