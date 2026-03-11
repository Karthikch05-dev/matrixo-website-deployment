'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiProps {
  active?: boolean
  duration?: number
}

export default function Confetti({ active = true, duration = 5000 }: ConfettiProps) {
  const [show, setShow] = useState(active)

  useEffect(() => {
    if (active && duration > 0) {
      const timer = setTimeout(() => setShow(false), duration)
      return () => clearTimeout(timer)
    }
  }, [active, duration])

  if (!show) return null

  // Generate random confetti pieces
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDelay: Math.random() * 2,
    animationDuration: 3 + Math.random() * 2,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'][Math.floor(Math.random() * 8)],
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360,
    swing: Math.random() * 100 - 50,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {confettiPieces.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute"
            initial={{
              top: -20,
              left: `${piece.left}%`,
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              top: '110%',
              left: `${piece.left + piece.swing}%`,
              rotate: [0, 360, 720, 1080],
              opacity: [1, 1, 0.8, 0],
            }}
            transition={{
              duration: piece.animationDuration,
              delay: piece.animationDelay,
              ease: 'easeIn',
            }}
            style={{
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
