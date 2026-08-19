import { motion } from "framer-motion";

// Ambient background for the footer, styled after the published Framer
// "Breathing Footer" component (https://framer.com/m/Breathing-Footer-aoASzs.js@APO0CZm0ktGn4rqVS8or):
// soft radial glow blobs that slowly pulse in place — its signature look and
// the origin of its name. That module's own footer content (nav columns
// for "Studio/Work/Connect", "hello@prisma.studio", a "Made by Matt"
// credit) is hardcoded with no addPropertyControls to override, so only the
// *visual language* — the breathing glow, the giant low-opacity wordmark
// treatment used alongside it in Footer.tsx — is reproduced here with
// framer-motion (already a project dependency); every real footer function
// stays exactly as it was.
//
// Timing matches the source bundle's own ambient-loop transition
// (duration 6s, ease [.45,0,.55,1], tween) rather than a made-up value.
const BREATHE_TRANSITION = {
  duration: 6,
  ease: [0.45, 0, 0.55, 1] as const,
  repeat: Infinity,
};

export function BreathingGlow() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <motion.div
        className="absolute -top-24 left-[8%] w-[420px] h-[420px] rounded-full blur-[110px]"
        style={{ background: "hsl(168,72%,42%)" }}
        animate={{ opacity: [0.08, 0.18, 0.08], scale: [1, 1.12, 1] }}
        transition={{ ...BREATHE_TRANSITION, delay: 0 }}
      />
      <motion.div
        className="absolute bottom-0 right-[10%] w-[380px] h-[380px] rounded-full blur-[100px]"
        style={{ background: "hsl(204,70%,53%)" }}
        animate={{ opacity: [0.06, 0.16, 0.06], scale: [1, 1.15, 1] }}
        transition={{ ...BREATHE_TRANSITION, delay: 2 }}
      />
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full blur-[110px]"
        style={{ background: "hsl(280,60%,72%)" }}
        animate={{ opacity: [0.04, 0.1, 0.04], scale: [1, 1.1, 1] }}
        transition={{ ...BREATHE_TRANSITION, delay: 4 }}
      />
    </div>
  );
}
