"use client";

import { motion } from "framer-motion";

// Decorative 3D icons (Microsoft Fluent Emoji, MIT) that drift gently in the section corners.
// With "reduce motion" on, MotionConfig in the layout skips the movement and they stay still.
function FloatingIcon({ src, size, className, delay = 0, rotate = 0, drift = 10, duration = 6 }) {
  return (
    <motion.img
      src={src}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={`absolute select-none drop-shadow-[0_10px_12px_rgba(0,0,0,0.12)] ${className}`}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.85, rotate }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      animate={{ y: [0, -drift, 0], rotate: [rotate, rotate + 4, rotate] }}
      transition={{
        opacity: { duration: 0.6, delay },
        scale: { type: "spring", bounce: 0.3, duration: 0.8, delay },
        y: { duration, delay: delay + 0.6, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: duration * 1.3, delay: delay + 0.6, repeat: Infinity, ease: "easeInOut" },
      }}
    />
  );
}

export function FloatingIcons() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
      {/* Top right: notebook and pen */}
      <div className="absolute right-[5%] top-10 h-40 w-44 lg:right-[8%]">
        <FloatingIcon src="/icons3d/notebook_3d.png" size={112} className="right-0 top-0" rotate={-8} delay={0} duration={6} />
        <FloatingIcon src="/icons3d/fountain_pen_3d.png" size={76} className="right-[84px] top-[64px]" rotate={12} delay={0.25} drift={8} duration={5} />
      </div>

      {/* Top left: magnifying glass and a rolled diploma */}
      <div className="absolute left-[5%] top-10 h-40 w-44 lg:left-[8%]">
        <FloatingIcon src="/icons3d/magnifying_glass_tilted_left_3d.png" size={104} className="left-0 top-0" rotate={6} delay={0.15} duration={6.5} />
        <FloatingIcon src="/icons3d/scroll_3d.png" size={84} className="left-[80px] top-[66px]" rotate={-10} delay={0.4} drift={9} duration={5.5} />
      </div>
    </div>
  );
}
