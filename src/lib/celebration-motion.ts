export function pipCelebrationMotion(reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      animate: { y: 0, rotate: 0, scale: 1 },
      transition: { duration: 0 },
    };
  }

  return {
    animate: {
      y: [0, -10, 0, -5, 0],
      rotate: [0, -5, 5, -2, 0],
      scale: [1, 1.08, 1],
    },
    transition: { duration: 1.2, repeat: Infinity, repeatDelay: 0.7 },
  };
}
