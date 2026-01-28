"use client";

import { useWrapperStore } from "@/src/store/useWrapperStore";

export function DevTool() {
    const { isMock, toggleMockMode } = useWrapperStore();

    // Only render in development to avoid exposing dev controls in production
    if (process.env.NODE_ENV !== "development") {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
            <button
                onClick={toggleMockMode}
                className={`px-4 py-2 rounded-full font-bold text-sm shadow-lg transition-all active:scale-95 ${
                    isMock
                        ? "bg-green-500 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
            >
                {isMock ? "Mock Mode: ON" : "Mock Mode: OFF"}
            </button>
        </div>
    );
}
