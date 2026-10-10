import type { Transition } from "framer-motion";

export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 30,
  mass: 0.9,
};
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 35,
  mass: 0.7,
};
export const easeOutExpo: Transition = {
  duration: 0.55,
  ease: [0.16, 1, 0.3, 1],
};
export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: easeOutExpo,
};
