'use client'

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useEffect, useState, useCallback } from 'react'

// Ordered navbar routes for direction calculation
const routeOrder = [
    '/',
    '/events',
    '/services',
    '/about',
    '/team',
    '/contact',
    '/careers',
    // Beta features (come after main nav)
    '/skilldna',
    '/growgrid',
    '/playcred',
    '/mentormatrix',
    '/impactvault',
    '/profile',
]

function getRouteIndex(pathname: string): number {
    // Exact match first
    const exact = routeOrder.indexOf(pathname)
    if (exact !== -1) return exact

    // Prefix match (e.g. /events/something matches /events)
    for (let i = routeOrder.length - 1; i >= 0; i--) {
        if (routeOrder[i] !== '/' && pathname.startsWith(routeOrder[i])) {
            return i
        }
    }

    // Unknown routes default to center
    return Math.floor(routeOrder.length / 2)
}

// Slide distance (px) — kept moderate for smooth feel
const SLIDE_DISTANCE = 80

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const prevPathRef = useRef(pathname)
    const [direction, setDirection] = useState(0)

    useEffect(() => {
        const prevIndex = getRouteIndex(prevPathRef.current)
        const currIndex = getRouteIndex(pathname)

        if (prevPathRef.current !== pathname) {
            setDirection(currIndex > prevIndex ? 1 : currIndex < prevIndex ? -1 : 0)
            prevPathRef.current = pathname
        }
    }, [pathname])

    const variants = {
        initial: (dir: number) => ({
            x: dir * SLIDE_DISTANCE,
            opacity: 0,
        }),
        animate: {
            x: 0,
            opacity: 1,
            transition: {
                x: { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 },
                opacity: { duration: 0.2, ease: 'easeOut' },
            },
        },
        exit: (dir: number) => ({
            x: dir * -SLIDE_DISTANCE,
            opacity: 0,
            transition: {
                x: { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 },
                opacity: { duration: 0.15, ease: 'easeIn' },
            },
        }),
    }

    return (
        <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
                key={pathname}
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="will-change-transform"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}
