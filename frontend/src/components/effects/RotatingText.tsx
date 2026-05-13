import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RotatingTextProps {
  texts: string[];
  rotationInterval?: number;
  staggerDuration?: number;
  className?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
}

export default function RotatingText({
  texts,
  rotationInterval = 2500,
  staggerDuration = 0.02,
  className = '',
  splitLevelClassName = '',
  elementLevelClassName = '',
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % texts.length), rotationInterval);
    return () => clearInterval(id);
  }, [texts.length, rotationInterval]);

  const elements = useMemo(() => {
    const words = texts[index].split(' ');
    return words.map((word, i) => ({
      chars: Array.from(word),
      needsSpace: i < words.length - 1,
    }));
  }, [texts, index]);

  const getDelay = useCallback(
    (charIdx: number) => charIdx * staggerDuration,
    [staggerDuration]
  );

  let charCounter = 0;

  return (
    <span
      className={`inline-flex flex-wrap relative align-baseline leading-[1.2] ${className}`}
      style={{ paddingBottom: '0.18em' }}
    >
      <AnimatePresence mode="wait">
        <motion.span key={index} className="inline-flex flex-wrap" aria-hidden="true">
          {elements.map((wordObj, wIdx) => (
            <span key={wIdx} className={`inline-flex ${splitLevelClassName}`}>
              {wordObj.chars.map((char) => {
                const ci = charCounter++;
                return (
                  <motion.span
                    key={ci}
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '-120%', opacity: 0 }}
                    transition={{
                      type: 'spring',
                      damping: 25,
                      stiffness: 300,
                      delay: getDelay(ci),
                    }}
                    className={`inline-block ${elementLevelClassName}`}
                  >
                    {char}
                  </motion.span>
                );
              })}
              {wordObj.needsSpace && <span className="inline-block">&nbsp;</span>}
            </span>
          ))}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only">{texts[index]}</span>
    </span>
  );
}
