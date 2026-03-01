'use client'

import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

// Ordered routes matching navbar tab positions
const routeOrder = [
    '/',
    '/events',
    '/services',
    '/about',
    '/team',
    '/contact',
    '/careers',
    // Beta features (positioned after main nav)
    '/skilldna',
    '/growgrid',
    '/playcred',
    '/mentormatrix',
    '/impactvault',
    '/profile',
]

function getRouteIndex(pathname: string): number {
    const exact = routeOrder.indexOf(pathname)
    if (exact !== -1) return exact
    for (let i = routeOrder.length - 1; i >= 0; i--) {
        if (routeOrder[i] !== '/' && pathname.startsWith(routeOrder[i])) return i
    }
    return Math.floor(routeOrder.length / 2)
}

// Store previous route index globally so it persists across template re-renders
let prevRouteIndex = -1

const SLIDE_DISTANCE = 60

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const currIndex = getRouteIndex(pathname)

    // Calculate direction
    let direction = 0
    if (prevRouteIndex !== -1 && prevRouteIndex !== currIndex) {
        direction = currIndex > prevRouteIndex ? 1 : -1
    }

    // Update stored index after calculating direction
    useEffect(() => {
        prevRouteIndex = currIndex
    }, [currIndex])

    return (
        <motion.div
            key={pathname}
            initial={{ x: direction * SLIDE_DISTANCE, opacity: 0 }}
            animate={{
                x: 0,
                opacity: 1,
                transition: {
                    x: { type: 'spring', stiffness: 260, damping: 26, mass: 0.7 },
                    opacity: { duration: 0.25, ease: 'easeOut' },
                },
            }}
            className="will-change-transform"
        >
            {children}
        </motion.div>
    )
}
