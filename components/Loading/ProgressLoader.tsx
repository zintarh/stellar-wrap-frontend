"use client"

import { useEffect, useState } from "react"

const ProgressLoader = () => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 1
      })
    }, 20)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-[20%] mx-auto h-1 bg-black/10 rounded-full overflow-hidden mt-4">
      <div
        className="h-full bg-[#b408b4]/50 transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export default ProgressLoader
