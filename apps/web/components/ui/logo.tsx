import React from "react";

export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div
      className={`${className} bg-brand rounded-xl flex items-center justify-center`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[60%] h-[60%]"
      >
        <path
          d="M4 8C4 6.89543 4.89543 6 6 6H14C15.1046 6 16 6.89543 16 8V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V8Z"
          fill="white"
        />
        <path d="M16 10L20 8V16L16 14V10Z" fill="white" />
      </svg>
    </div>
  );
}

interface LogoWithTextProps {
  className?: string;
  variant?: "light" | "dark";
}

export function LogoWithText({
  className = "",
  variant = "dark",
}: LogoWithTextProps) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Logo className="w-9 h-9" />
      <span
        className={`text-xl font-bold ${variant === "light" ? "text-white" : "text-foreground"}`}
      >
        AI Interview
      </span>
    </div>
  );
}
