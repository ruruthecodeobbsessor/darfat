"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const IMAGES = ["/hero/hero-1.webp", "/hero/hero-2.webp"];
const INTERVAL = 6000;

// Hero backdrop: photos cross-fade with a slow zoom, under a soft blurred veil that keeps the text readable.
export function HeroBackground() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => setIndex((current) => (current + 1) % IMAGES.length), INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={IMAGES[index]}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMAGES[index]})` }}
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.12 }}
          animate={{ opacity: 1, scale: reduceMotion ? 1 : 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.6, ease: [0.22, 1, 0.36, 1] },
            scale: { duration: INTERVAL / 1000 + 1.6, ease: "linear" },
          }}
        />
      </AnimatePresence>

      {/* Frosted veil: blur plus a light wash, strongest behind the text. */}
      <div className="absolute inset-0 bg-white/45 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.75)_0%,rgba(255,255,255,0.35)_60%,rgba(255,255,255,0.15)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}
