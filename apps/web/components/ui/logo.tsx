import React from 'react';

export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`${className} bg-yellow-400 rounded-xl flex items-center justify-center`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[60%] h-[60%]"
      >
        <path
          d="M4 8C4 6.89543 4.89543 6 6 6H14C15.1046 6 16 6.89543 16 8V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V8Z"
          fill="#374151"
        />
        <path
          d="M16 10L20 8V16L16 14V10Z"
          fill="#374151"
        />
      </svg>
    </div>
  );
}

export function LogoWithText({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Logo className="w-10 h-10" />
      <span className="text-2xl font-bold text-white">
        AI Interview
      </span>
    </div>
  );
}
