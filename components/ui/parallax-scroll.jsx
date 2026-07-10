"use client";
import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export const ParallaxScroll = ({
  images,
  className,
  autoMove = true,
}) => {
  const gridRef = useRef(null);
  const { scrollYProgress } = useScroll({
    container: gridRef,
    offset: ["start start", "end start"],
  });

  // Scroll parallax transforms
  const translateFirst = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const translateSecond = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const translateThird = useTransform(scrollYProgress, [0, 1], [0, -200]);

  const third = Math.ceil(images.length / 3);

  const firstPart = images.slice(0, third);
  const secondPart = images.slice(third, 2 * third);
  const thirdPart = images.slice(2 * third);

  // Duplicate for seamless vertical looping when autoMove is true
  const firstCol = autoMove ? [...firstPart, ...firstPart] : firstPart;
  const secondCol = autoMove ? [...secondPart, ...secondPart] : secondPart;
  const thirdCol = autoMove ? [...thirdPart, ...thirdPart] : thirdPart;

  return (
    <div
      className={cn(
        "absolute inset-0 z-0 overflow-hidden bg-zinc-950 pointer-events-none",
        className
      )}
      ref={gridRef}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-6 py-4 px-4 max-w-7xl mx-auto opacity-100">
        {/* Column 1 - Moving UP */}
        <motion.div
          style={autoMove ? { animation: "parallax-up 38s linear infinite" } : { y: translateFirst }}
          className={cn("grid gap-6 will-change-transform", autoMove && "animate-parallax-up")}
        >
          {firstCol.map((el, idx) => (
            <div key={"grid-1" + idx} className="overflow-hidden rounded-3xl border border-white/15 shadow-2xl bg-zinc-900/40">
              <img
                src={el}
                className="h-80 w-full object-cover object-center rounded-3xl transform transition-transform duration-700 hover:scale-105 brightness-110 contrast-105"
                alt="travel destination"
              />
            </div>
          ))}
        </motion.div>

        {/* Column 2 - Moving DOWN (Parallel Opposite Direction) */}
        <motion.div
          style={autoMove ? { animation: "parallax-down 44s linear infinite" } : { y: translateSecond }}
          className={cn("grid gap-6 will-change-transform", autoMove && "animate-parallax-down")}
        >
          {secondCol.map((el, idx) => (
            <div key={"grid-2" + idx} className="overflow-hidden rounded-3xl border border-white/15 shadow-2xl bg-zinc-900/40">
              <img
                src={el}
                className="h-80 w-full object-cover object-center rounded-3xl transform transition-transform duration-700 hover:scale-105 brightness-110 contrast-105"
                alt="travel destination"
              />
            </div>
          ))}
        </motion.div>

        {/* Column 3 - Moving UP */}
        <motion.div
          style={autoMove ? { animation: "parallax-up 40s linear infinite" } : { y: translateThird }}
          className={cn("grid gap-6 will-change-transform", autoMove && "animate-parallax-up")}
        >
          {thirdCol.map((el, idx) => (
            <div key={"grid-3" + idx} className="overflow-hidden rounded-3xl border border-white/15 shadow-2xl bg-zinc-900/40">
              <img
                src={el}
                className="h-80 w-full object-cover object-center rounded-3xl transform transition-transform duration-700 hover:scale-105 brightness-110 contrast-105"
                alt="travel destination"
              />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Gentle Dark Vignette Overlays so Images remain Bright & Colorful while text pops clearly */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-zinc-950/80 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-950/40 via-transparent to-zinc-950/80 pointer-events-none" />
    </div>
  );
};
