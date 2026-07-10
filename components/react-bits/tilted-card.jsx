"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export default function TiltedCard({
  children,
  className = "",
  maxTilt = 12,
  scaleOnHover = 1.03,
  showGlare = true,
  glareColor = "rgba(255, 255, 255, 0.25)",
}) {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Rotate Y based on horizontal mouse position (-0.5 to 0.5 -> -maxTilt to maxTilt)
  const rotateY = useTransform(springX, [0, 1], [-maxTilt, maxTilt]);
  // Rotate X based on vertical mouse position (-0.5 to 0.5 -> maxTilt to -maxTilt)
  const rotateX = useTransform(springY, [0, 1], [maxTilt, -maxTilt]);

  // Glare position moves smoothly across the card
  const glareX = useTransform(springX, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(springY, [0, 1], ["0%", "100%"]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      animate={{
        scale: isHovered ? scaleOnHover : 1,
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("relative overflow-hidden cursor-pointer", className)}
    >
      {/* Main card content with 3D depth */}
      <div style={{ transform: "translateZ(20px)", transformStyle: "preserve-3d" }} className="w-full h-full">
        {children}
      </div>

      {/* Dynamic glossy reflection glare overlay */}
      {showGlare && (
        <motion.div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-30"
          style={{
            background: `radial-gradient(circle at ${glareX.get()} ${glareY.get()}, ${glareColor} 0%, transparent 60%)`,
            opacity: isHovered ? 0.8 : 0,
          }}
        />
      )}
    </motion.div>
  );
}
