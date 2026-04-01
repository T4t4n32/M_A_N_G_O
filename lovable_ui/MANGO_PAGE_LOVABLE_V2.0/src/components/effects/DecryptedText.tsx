import { useEffect, useState, useRef, useMemo, useCallback, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: 'view' | 'hover';
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = 'start',
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  encryptedClassName = '',
  animateOn = 'view',
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(true);
  const containerRef = useRef<HTMLSpanElement>(null);

  const availableChars = useMemo(
    () => characters.split(''),
    [characters]
  );

  const shuffleText = useCallback(
    (original: string, revealed: Set<number>) =>
      original.split('').map((c, i) => {
        if (c === ' ') return ' ';
        if (revealed.has(i)) return original[i];
        return availableChars[Math.floor(Math.random() * availableChars.length)];
      }).join(''),
    [availableChars]
  );

  const getNextIndex = useCallback(
    (revealed: Set<number>) => {
      const len = text.length;
      if (revealDirection === 'start') return revealed.size;
      if (revealDirection === 'end') return len - 1 - revealed.size;
      const mid = Math.floor(len / 2);
      const off = Math.floor(revealed.size / 2);
      const next = revealed.size % 2 === 0 ? mid + off : mid - off - 1;
      if (next >= 0 && next < len && !revealed.has(next)) return next;
      for (let i = 0; i < len; i++) if (!revealed.has(i)) return i;
      return 0;
    },
    [text, revealDirection]
  );

  const triggerDecrypt = useCallback(() => {
    setRevealedIndices(new Set());
    setIsAnimating(true);
    setIsDecrypted(false);
  }, []);

  useEffect(() => {
    if (!isAnimating) return;
    let iteration = 0;
    const interval = setInterval(() => {
      setRevealedIndices(prev => {
        if (sequential) {
          if (prev.size < text.length) {
            const next = getNextIndex(prev);
            const newSet = new Set(prev);
            newSet.add(next);
            setDisplayText(shuffleText(text, newSet));
            return newSet;
          }
          clearInterval(interval);
          setIsAnimating(false);
          setIsDecrypted(true);
          return prev;
        }
        setDisplayText(shuffleText(text, prev));
        iteration++;
        if (iteration >= maxIterations) {
          clearInterval(interval);
          setIsAnimating(false);
          setDisplayText(text);
          setIsDecrypted(true);
        }
        return prev;
      });
    }, speed);
    return () => clearInterval(interval);
  }, [isAnimating, text, speed, maxIterations, sequential, shuffleText, getNextIndex]);

  // View observer
  useEffect(() => {
    if (animateOn !== 'view') return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasAnimated) {
            triggerDecrypt();
            setHasAnimated(true);
          }
        });
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [animateOn, hasAnimated, triggerDecrypt]);

  const hoverProps = animateOn === 'hover'
    ? {
        onMouseEnter: () => { if (!isAnimating) { setRevealedIndices(new Set()); setIsDecrypted(false); setIsAnimating(true); } },
        onMouseLeave: () => { setIsAnimating(false); setRevealedIndices(new Set()); setDisplayText(text); setIsDecrypted(true); },
      }
    : {};

  return (
    <motion.span
      ref={containerRef}
      className={parentClassName}
      style={{ display: 'inline-block', whiteSpace: 'pre-wrap' }}
      {...hoverProps}
    >
      <span className="sr-only">{displayText}</span>
      <span aria-hidden="true">
        {displayText.split('').map((char, i) => {
          const revealed = revealedIndices.has(i) || (!isAnimating && isDecrypted);
          return (
            <span key={i} className={revealed ? className : encryptedClassName}>
              {char}
            </span>
          );
        })}
      </span>
    </motion.span>
  );
}
