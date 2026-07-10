"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export const RippleButton = React.forwardRef(
  (
    {
      className,
      children,
      rippleColor = "rgba(255, 255, 255, 0.35)",
      duration = "600ms",
      onClick,
      ...props
    },
    ref
  ) => {
    const [buttonRipples, setButtonRipples] = useState([])

    const handleClick = (event) => {
      createRipple(event)
      onClick?.(event)
    }

    const createRipple = (event) => {
      const button = event.currentTarget
      const rect = button.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 2
      const x = event.clientX - rect.left - size / 2
      const y = event.clientY - rect.top - size / 2

      const newRipple = { x, y, size, key: Date.now() + Math.random() }
      setButtonRipples((prevRipples) => [...prevRipples, newRipple])
    }

    useEffect(() => {
      if (buttonRipples.length > 0) {
        const lastRipple = buttonRipples[buttonRipples.length - 1]
        const durNum = parseInt(duration, 10) || 600
        const timeout = setTimeout(() => {
          setButtonRipples((prevRipples) =>
            prevRipples.filter((ripple) => ripple.key !== lastRipple.key)
          )
        }, durNum)
        return () => clearTimeout(timeout)
      }
    }, [buttonRipples, duration])

    const durationSeconds = (parseInt(duration, 10) || 600) / 1000

    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-zinc-900/80 px-5 py-2.5 font-medium text-white shadow-lg backdrop-blur-xl transition-all duration-200 hover:border-white/25 hover:bg-zinc-800/80 hover:shadow-xl active:scale-[0.98] select-none",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2 tracking-wide whitespace-nowrap">
          {children}
        </span>
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          {buttonRipples.map((ripple) => (
            <motion.span
              key={ripple.key}
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 0 }}
              transition={{ duration: durationSeconds, ease: "easeOut" }}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: `${ripple.size}px`,
                height: `${ripple.size}px`,
                top: `${ripple.y}px`,
                left: `${ripple.x}px`,
                backgroundColor: rippleColor,
              }}
            />
          ))}
        </span>
      </button>
    )
  }
)

RippleButton.displayName = "RippleButton"
export default RippleButton
