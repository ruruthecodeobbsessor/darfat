"use client";

import { motion, MotionConfig } from "framer-motion";

// Entrance motion is small and critically damped (no overshoot): content settles, it doesn't bounce.
const SPRING = { type: "spring", bounce: 0, duration: 0.5 };
const DISTANCE = 12;

// App-wide: with "reduce motion" on, framer-motion skips movement and keeps only opacity.
export function MotionProvider({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export const SlideUp = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: DISTANCE }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ ...SPRING, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export const FadeIn = ({ children, delay = 0, className = "" }) => (
  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay, ease: "easeOut" }} className={className}>
    {children}
  </motion.div>
);

export const ScaleIn = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true, margin: "-20px" }}
    transition={{ ...SPRING, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export const SlideDown = ({ children, delay = 0, className = "" }) => (
  <motion.div initial={{ opacity: 0, y: -DISTANCE }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay }} className={className}>
    {children}
  </motion.div>
);

export const StaggerContainer = ({ children, delayChildren = 0, staggerChildren = 0.06, className = "" }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-40px" }}
    variants={{ hidden: {}, visible: { transition: { staggerChildren, delayChildren } } }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className = "" }) => (
  <motion.div
    variants={{ hidden: { opacity: 0, y: DISTANCE }, visible: { opacity: 1, y: 0, transition: SPRING } }}
    className={className}
  >
    {children}
  </motion.div>
);
