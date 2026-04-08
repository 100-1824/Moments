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
      <div
        ref={ref}
        className={cn(
          variant === "extruded"
            ? size === "sm" ? "neu-extruded-sm" : "neu-extruded"
            : size === "sm" ? "neu-depressed-sm" : "neu-depressed",
          "rounded-[32px] p-6",
          className
        )}
        {...props}
      />
    );
  }
);

interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  active?: boolean;
}

export const NeuButton = React.forwardRef<HTMLButtonElement, NeuButtonProps>(
  ({ className, size = "md", active = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "neu-button rounded-full flex items-center justify-center transition-all duration-200",
          size === "sm" ? "w-10 h-10" : size === "md" ? "w-16 h-16" : "w-20 h-20",
          active && "neu-depressed",
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
          "neu-depressed-sm w-full rounded-2xl px-4 py-3 bg-transparent outline-none text-text-main placeholder:text-text-main/40",
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
          "neu-depressed-sm w-full rounded-2xl px-4 py-3 bg-transparent outline-none text-text-main placeholder:text-text-main/40 resize-none",
          className
        )}
        {...props}
      />
    );
  }
);

export const DailyProgress = ({ count, max = 3 }: { count: number; max?: number }) => {
  return (
    <div className="flex gap-4 justify-center items-center">
      {Array.from({ length: max }).map((_, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{
            scale: i < count ? 1.1 : 1,
          }}
          className={cn(
            "w-4 h-4 rounded-full transition-all duration-300",
            i < count 
              ? "neu-extruded bg-accent-terracotta/20 shadow-[4px_4px_8px_rgba(217,119,87,0.3),-4px_-4px_8px_#FFFFFF]" 
              : "neu-depressed-sm"
          )}
        />
      ))}
    </div>
  );
};
