import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { editorialEase } from '../../utils/motionVariants';

// ================= 1. SIGNATURE CURL MOTIF (〰) =================
interface HandDrawnCurlProps {
  className?: string;
  color?: string;
  width?: number | string;
  strokeWidth?: number;
  duration?: number;
  delay?: number;
}

export const HandDrawnCurl: React.FC<HandDrawnCurlProps> = ({
  className = '',
  color = '#B89552',
  width = 64,
  strokeWidth = 2,
  duration = 1.1,
  delay = 0.2,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      width={width}
      height="18"
      viewBox="0 0 120 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block overflow-visible ${className}`}
      aria-hidden="true"
    >
      <motion.path
        d="M 4,14 C 18,3 32,3 46,14 C 60,25 74,25 88,14 C 98,6 108,8 116,14"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: shouldReduceMotion ? 1 : 0, opacity: shouldReduceMotion ? 1 : 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{
          duration: shouldReduceMotion ? 0.01 : duration,
          delay,
          ease: editorialEase,
        }}
      />
    </svg>
  );
};

// Continuous delicate wave curl divider
export const CurlDivider: React.FC<{ className?: string; color?: string }> = ({
  className = '',
  color = 'rgba(184, 149, 82, 0.4)',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`flex items-center justify-center my-8 ${className}`}>
      <svg
        width="140"
        height="20"
        viewBox="0 0 180 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        aria-hidden="true"
      >
        <motion.path
          d="M 6,12 C 22,2 38,2 54,12 C 70,22 86,22 102,12 C 118,2 134,2 150,12 C 160,18 168,18 174,12"
          stroke={color}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: shouldReduceMotion ? 1 : 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{
            duration: shouldReduceMotion ? 0.01 : 1.3,
            ease: editorialEase,
          }}
        />
      </svg>
    </div>
  );
};

// ================= 2. ORGANIC BRAND MOTIFS (Butter Yellow #F1E3A6 & Soft Sage #AAB39A) =================
interface OrganicShapeProps {
  variant?: 'hero' | 'candid' | 'quote' | 'corner' | 'wide' | 'sage';
  className?: string;
  opacity?: number;
}

export const OrganicShape: React.FC<OrganicShapeProps> = ({
  variant = 'hero',
  className = '',
  opacity = 0.9,
}) => {
  if (variant === 'candid') {
    // Asymmetric contour for candid intro portrait
    return (
      <svg
        viewBox="0 0 420 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`pointer-events-none select-none ${className}`}
        style={{ opacity }}
        aria-hidden="true"
      >
        <path
          d="M 120,40 C 230,10 340,30 385,110 C 430,190 410,290 375,370 C 340,450 250,480 160,460 C 70,440 20,370 15,280 C 10,190 35,100 120,40 Z"
          fill="#F1E3A6"
        />
      </svg>
    );
  }

  if (variant === 'sage') {
    // Soft Sage organic accent
    return (
      <svg
        viewBox="0 0 360 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`pointer-events-none select-none ${className}`}
        style={{ opacity }}
        aria-hidden="true"
      >
        <path
          d="M 90,30 C 180,15 280,35 320,105 C 360,175 345,260 310,325 C 275,390 195,410 120,385 C 45,360 15,295 10,215 C 5,135 25,65 90,30 Z"
          fill="#AAB39A"
          fillOpacity="0.45"
        />
      </svg>
    );
  }

  if (variant === 'quote') {
    // Sprawling soft organic pool behind quotes
    return (
      <svg
        viewBox="0 0 600 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`pointer-events-none select-none ${className}`}
        style={{ opacity }}
        aria-hidden="true"
      >
        <path
          d="M 160,35 C 320,-10 470,20 540,105 C 610,190 580,285 500,340 C 420,395 280,380 160,355 C 40,330 -10,265 8,180 C 26,95 70,60 160,35 Z"
          fill="#F1E3A6"
          fillOpacity="0.55"
        />
      </svg>
    );
  }

  if (variant === 'corner') {
    // Sweeping edge form for section transition / CTA
    return (
      <svg
        viewBox="0 0 540 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`pointer-events-none select-none ${className}`}
        style={{ opacity }}
        aria-hidden="true"
      >
        <path
          d="M 180,20 C 310,-10 440,30 495,120 C 550,210 545,330 510,430 C 475,530 380,590 280,600 C 180,610 80,550 35,460 C -10,370 -5,250 25,160 C 55,70 90,40 180,20 Z"
          fill="#F1E3A6"
        />
      </svg>
    );
  }

  // Default Hero organic hand-painted form
  return (
    <svg
      viewBox="0 0 500 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <path
        d="M 190,20 C 300,10 405,45 450,115 C 495,185 490,270 475,355 C 460,440 410,510 330,540 C 250,570 150,545 90,490 C 30,435 15,350 20,265 C 25,180 50,110 100,55 C 130,22 155,23 190,20 Z"
        fill="#F1E3A6"
      />
    </svg>
  );
};

// ================= 3. HAND-PAINTED BRUSH HIGHLIGHT =================
export const BrushHighlight: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0.8, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <span className={`relative inline-block ${className}`}>
      {/* Hand-painted stroke behind text */}
      <motion.span
        initial={{ scaleX: shouldReduceMotion ? 1 : 0, opacity: shouldReduceMotion ? 1 : 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{
          duration: shouldReduceMotion ? 0.01 : 0.75,
          delay: shouldReduceMotion ? 0 : delay,
          ease: editorialEase,
        }}
        style={{ originX: 0 }}
        className="absolute inset-x-0 bottom-1.5 sm:bottom-2.5 h-[34%] sm:h-[38%] bg-[#F1E3A6] -z-10 rounded-sm -rotate-0.5"
        aria-hidden="true"
      />
      <span className="relative z-10">{children}</span>
    </span>
  );
};

// ================= 4. TYPOGRAPHY MASKED LINE-BY-LINE REVEAL =================
interface TextLineRevealProps {
  lines: string[];
  className?: string;
  lineClassName?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div';
  staggerDelay?: number;
  startDelay?: number;
}

export const TextLineReveal: React.FC<TextLineRevealProps> = ({
  lines,
  className = '',
  lineClassName = '',
  tag = 'h2',
  staggerDelay = 0.14,
  startDelay = 0.1,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const Component = tag;

  return (
    <Component className={className}>
      {lines.map((line, index) => (
        <span key={index} className="block overflow-hidden py-0.5">
          <motion.span
            className={`block ${lineClassName}`}
            initial={{ y: shouldReduceMotion ? 0 : '108%', opacity: shouldReduceMotion ? 1 : 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{
              duration: shouldReduceMotion ? 0.01 : 0.85,
              delay: shouldReduceMotion ? 0 : startDelay + index * staggerDelay,
              ease: editorialEase,
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Component>
  );
};
