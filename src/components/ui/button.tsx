import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

const base =
  "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md";
const sizes: Record<string, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};
const variants: Record<string, string> = {
  default: "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-400",
  secondary: "bg-amber-400 text-white hover:bg-amber-500 focus:ring-amber-300",
  outline:
    "border border-amber-400 text-amber-600 hover:bg-amber-50 focus:ring-amber-300",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  )
);
Button.displayName = "Button";
