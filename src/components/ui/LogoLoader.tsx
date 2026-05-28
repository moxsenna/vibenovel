/**
 * LogoLoader — VibeNovel v2
 * 
 * A high-end, premium SVG loading component that recreates the intertwined "V" and "N"
 * neon logo design from image_e4606c.png using pure React, Framer Motion, and Tailwind CSS v4.
 * 
 * Animation Concept: "Malam Kreatif Neon Flow"
 * - Intertwined "V" and "N" neon glow tubes.
 * - Dynamic SVG Stroke Animation: Inner core paths animate like liquid pulses of light
 *   flowing through the letters with high-end neon aesthetics.
 * - Pulse/Glow Cycle: Continuous, soft breathing/pulsing glow matching color tokens.
 * - Flexible layout: Supports both an immersive full-screen splash overlay and an inline mini canvas.
 */

import React from 'react'
import { motion } from 'framer-motion'

interface LogoLoaderProps {
  /** If true, wraps the loader in a fullscreen premium plum backdrop overlay with soft blurs */
  fullscreen?: boolean
  /** Optional loading label displayed beneath the animated logo */
  label?: string
  /** The size (width/height) of the SVG container in pixels */
  size?: number
  /** Speed multiplier for the neon light flows and breathing cycles */
  speedMultiplier?: number
  /** Whether to enable the ambient neon outer glow effect */
  glow?: boolean
  /** Optional extra Tailwind CSS classes for the outer container */
  className?: string
}

export const LogoLoader: React.FC<LogoLoaderProps> = ({
  fullscreen = false,
  label,
  size = 140,
  speedMultiplier = 1.0,
  glow = true,
  className = ''
}) => {
  // Duration settings (scaled by speedMultiplier)
  const pulseDuration = 2.4 / speedMultiplier
  const breathingDuration = 3.0 / speedMultiplier

  // Centered coordinates for a 340 x 260 viewBox
  const coords = {
    // V-Outer centerline path
    vOuter: 'M 57.5,30 L 137.5,230 L 217.5,30',
    // V-Inner centerline path
    vInner: 'M 77.5,30 L 137.5,180 L 197.5,30',
    // N-Outer centerline path (Down, Up diagonal, Up right)
    nOuter: 'M 162.5,230 L 162.5,30 L 282.5,230 L 282.5,30',
    // N-Inner centerline path
    nInner: 'M 182.5,230 L 182.5,63.3 L 262.5,196.7 L 262.5,30'
  }

  // Pre-calculated path lengths for dash animations
  const lengths = {
    vOuter: 430.8,
    vInner: 323.0,
    nOuter: 633.2,
    nInner: 489.0
  }

  // Neon pulse length
  const pulseLength = 70

  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* SVG Container with premium breathing pulse animation */}
      <motion.div
        className="relative flex items-center justify-center"
        animate={
          glow
            ? {
                filter: [
                  'drop-shadow(0 0 10px rgba(184, 131, 224, 0.4)) drop-shadow(0 0 20px rgba(255, 152, 0, 0.2))',
                  'drop-shadow(0 0 18px rgba(184, 131, 224, 0.75)) drop-shadow(0 0 35px rgba(255, 152, 0, 0.45))',
                  'drop-shadow(0 0 10px rgba(184, 131, 224, 0.4)) drop-shadow(0 0 20px rgba(255, 152, 0, 0.2))'
                ]
              }
            : {}
        }
        transition={{
          duration: breathingDuration,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{ width: size, height: (size * 260) / 340 }}
      >
        <svg
          viewBox="0 0 340 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Beautiful, premium seamless neon flow gradient */}
            <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C39AE6" /> {/* Pastel Violet */}
              <stop offset="35%" stopColor="#9C27B0" /> {/* Neon Violet */}
              <stop offset="70%" stopColor="#E8A0BF" /> {/* Rose Gold Pink */}
              <stop offset="100%" stopColor="#FF9800" /> {/* Warm Neon Orange */}
            </linearGradient>

            {/* Glowing neon shadow filter */}
            <filter id="neonGlowBlur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur1" />
              <feGaussianBlur stdDeviation="15" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ==================== LAYER 1: BASE GLOW TUBES ==================== */}
          <g filter="url(#neonGlowBlur)" opacity="0.65">
            {/* V Base Tubes */}
            <path
              d={coords.vOuter}
              stroke="url(#neonGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={coords.vInner}
              stroke="url(#neonGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* N Base Tubes */}
            <path
              d={coords.nOuter}
              stroke="url(#neonGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={coords.nInner}
              stroke="url(#neonGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* ==================== LAYER 2: SHARP TUBE OUTLINES ==================== */}
          <g opacity="0.9">
            {/* V Sharp Outlines */}
            <path
              d={coords.vOuter}
              stroke="url(#neonGradient)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={coords.vInner}
              stroke="url(#neonGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* N Sharp Outlines (Intertwined behind V's right leg) */}
            <path
              d={coords.nOuter}
              stroke="url(#neonGradient)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={coords.nInner}
              stroke="url(#neonGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* ==================== LAYER 3: DYNAMIC LIQUID LIGHT PULSES ==================== */}
          {/* Animated cores using Framer Motion SVG dash offsets */}
          {/* V Outer Pulse */}
          <motion.path
            d={coords.vOuter}
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: `${pulseLength} ${lengths.vOuter}`,
              filter: 'drop-shadow(0 0 4px #FFFFFF) drop-shadow(0 0 8px rgba(156, 39, 176, 0.8))'
            }}
            animate={{
              strokeDashoffset: [pulseLength, -lengths.vOuter]
            }}
            transition={{
              duration: pulseDuration,
              repeat: Infinity,
              ease: 'linear'
            }}
          />

          {/* V Inner Pulse (Slight offset and opposite direction for natural complexity) */}
          <motion.path
            d={coords.vInner}
            stroke="#FFF0F5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: `${pulseLength - 15} ${lengths.vInner}`,
              filter: 'drop-shadow(0 0 3px #FFFFFF) drop-shadow(0 0 6px rgba(156, 39, 176, 0.6))'
            }}
            animate={{
              strokeDashoffset: [-lengths.vInner, pulseLength - 15]
            }}
            transition={{
              duration: pulseDuration * 0.9,
              repeat: Infinity,
              ease: 'linear'
            }}
          />

          {/* N Outer Pulse (Staggered to create seamless cross-over flow effect) */}
          <motion.path
            d={coords.nOuter}
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: `${pulseLength} ${lengths.nOuter}`,
              filter: 'drop-shadow(0 0 4px #FFFFFF) drop-shadow(0 0 8px rgba(255, 152, 0, 0.8))'
            }}
            animate={{
              strokeDashoffset: [pulseLength, -lengths.nOuter]
            }}
            transition={{
              duration: pulseDuration,
              delay: pulseDuration * 0.28, // Calculated perfectly so the flow ignites as V completes
              repeat: Infinity,
              ease: 'linear'
            }}
          />

          {/* N Inner Pulse */}
          <motion.path
            d={coords.nInner}
            stroke="#FFFFF0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: `${pulseLength - 15} ${lengths.nInner}`,
              filter: 'drop-shadow(0 0 3px #FFFFFF) drop-shadow(0 0 6px rgba(255, 152, 0, 0.6))'
            }}
            animate={{
              strokeDashoffset: [-lengths.nInner, pulseLength - 15]
            }}
            transition={{
              duration: pulseDuration * 0.95,
              delay: pulseDuration * 0.15,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </svg>
      </motion.div>

      {/* Premium subtle label */}
      {label && (
        <motion.p
          className="text-body-md font-medium tracking-wide text-center"
          style={{
            color: 'var(--m3-on-surface-variant)',
            opacity: 0.85,
            fontFamily: 'var(--font-body)',
            textShadow: '0 2px 10px rgba(26, 17, 24, 0.4)'
          }}
          animate={{
            opacity: [0.6, 0.95, 0.6]
          }}
          transition={{
            duration: breathingDuration,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {label}
        </motion.p>
      )}
    </div>
  )

  if (fullscreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-[#1A1118] ${className}`}
        style={{
          backgroundImage:
            'radial-gradient(circle at center, rgba(34, 21, 31, 0.9) 0%, #1A1118 100%)'
        }}
      >
        {/* Soft background ambient blurs for modern glassmorphic wow factor */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#9c27b0] opacity-[0.07] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-[#ff9800] opacity-[0.06] blur-[130px] pointer-events-none" />
        
        {/* Glassmorphic card backplate */}
        <div className="px-12 py-10 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md inner-glow shadow-2xl relative z-10">
          {loaderContent}
        </div>
      </div>
    )
  }

  return <div className={`inline-flex items-center justify-center ${className}`}>{loaderContent}</div>
}
