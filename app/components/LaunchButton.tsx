"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LaunchButton() {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.push('/connect')}
      className="btn-primary group relative flex items-center gap-3 text-lg animate-fade-in-up delay-800"
    >
      {/* Shimmer effect */}
      <span className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Button content */}
      <span className="relative flex items-center gap-3 z-10">
        <span>Start Your Wrap</span>
        <span className="animate-arrow-bounce">
          <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
        </span>
      </span>
    </button>
  );
}
