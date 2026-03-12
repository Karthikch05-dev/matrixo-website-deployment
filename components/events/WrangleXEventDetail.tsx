'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  FaCalendar,
  FaMapMarkerAlt,
  FaClock,
  FaExternalLinkAlt,
  FaChevronDown,
  FaTag
} from 'react-icons/fa'

export default function WrangleXEventDetail({ event }: { event: any }) {
  const eventsSectionRef = useRef<HTMLDivElement>(null)

  const scrollToEvents = () => {
    eventsSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  const subEvents = event.subEvents || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f1c] via-[#0d1529] to-[#0a0f1c]">
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1c] via-[#0d1830] to-[#0a0f1c]" />

          {/* Animated grid */}
          <div className="absolute inset-0 opacity-15">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(rgba(168, 85, 247, 0.12) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(168, 85, 247, 0.12) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }} />
          </div>

          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-purple-400 rounded-full animate-float opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 20}s`,
              }}
            />
          ))}

          {/* Glow orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left - Poster */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="w-full lg:w-1/2 max-w-lg"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20">
  FaChevronLeft,
  FaChevronRight,
  FaExternalLinkAlt,
  FaGamepad,
  FaCode,
  FaPaintBrush,
  FaTrophy
} from 'react-icons/fa'

interface SubEvent {
  name: string
  description: string
  image: string
  images?: string[]
  registrationLink: string
  category: string
}

// Auto-sliding image component for sub-event posters
function AutoSlideImage({ images, alt, className }: { images: string[], alt: string, className?: string }) {
  const [imgIndex, setImgIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => {
      setImgIndex(prev => (prev + 1) % images.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={imgIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <Image
            src={images[imgIndex]}
            alt={alt}
            fill
            className={className || 'object-cover'}
          />
        </motion.div>
      </AnimatePresence>
      {/* Image dots */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === imgIndex ? 'bg-white w-4' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default function WrangleXEventDetail({ event }: { event: any }) {
  const subEvents: SubEvent[] = event.subEvents || []
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const touchStartX = useRef(0)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  const goTo = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }, [currentIndex])

  const goNext = useCallback(() => {
    setDirection(1)
    setCurrentIndex(prev => (prev + 1) % subEvents.length)
  }, [subEvents.length])

  const goPrev = useCallback(() => {
    setDirection(-1)
    setCurrentIndex(prev => (prev - 1 + subEvents.length) % subEvents.length)
  }, [subEvents.length])

  // Auto-play main carousel
  useEffect(() => {
    autoPlayRef.current = setInterval(goNext, 8000)
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [goNext])

  const resetAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    autoPlayRef.current = setInterval(goNext, 8000)
  }, [goNext])

  const handlePrev = () => { goPrev(); resetAutoPlay() }
  const handleNext = () => { goNext(); resetAutoPlay() }
  const handleDotClick = (i: number) => { goTo(i); resetAutoPlay() }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext()
      else handlePrev()
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Tech Competition': return <FaCode />
      case 'Esports': return <FaGamepad />
      case 'Non-Tech': return <FaPaintBrush />
      default: return <FaTrophy />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Tech Competition': return 'from-blue-500 to-cyan-500'
      case 'Esports': return 'from-red-500 to-orange-500'
      case 'Non-Tech': return 'from-green-500 to-emerald-500'
      default: return 'from-purple-500 to-pink-500'
    }
  }

  const currentEvent = subEvents[currentIndex]
  const getImages = (sub: SubEvent) => sub.images && sub.images.length > 0 ? sub.images : [sub.image]

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 600 : -600, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -600 : 600, opacity: 0 })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0f1c] dark:via-[#0d1529] dark:to-[#0a0f1c]">
      {/* HERO — Main Poster */}
      <section className="relative pt-20 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-indigo-50/50 dark:from-[#0a0f1c] dark:via-[#0d1830] dark:to-[#0a0f1c]" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-300/20 dark:bg-blue-600/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Back link */}
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 text-sm"
          >
            <FaChevronLeft className="text-xs" /> Back to Events
          </Link>

          {/* Main poster & event info */}
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Poster Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-1/2 max-w-lg"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10 dark:shadow-purple-900/20 border border-gray-200 dark:border-white/10">
                <Image
                  src={event.images.banner}
                  alt={event.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </motion.div>

            {/* Right - Info */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="w-full lg:w-1/2 text-center lg:text-left"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
                <span className="text-purple-400 text-sm font-medium">INFOQUEST 2026</span>
              </div>

              {/* Title */}
              <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight">
                <span className="bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                  {event.title}
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-purple-300/80 font-light mb-8">
                {event.tagline}
              </p>

              {/* Event Meta */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
                <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                  <FaCalendar className="text-purple-400" />
                  <span className="text-white text-sm">{format(new Date(event.date), 'MMM dd')} – {format(new Date(event.endDate), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                  <FaMapMarkerAlt className="text-purple-400" />
                  <span className="text-white text-sm">{event.location}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                  <FaClock className="text-purple-400" />
                  <span className="text-white text-sm">3 Events</span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <motion.button
                  onClick={scrollToEvents}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full font-bold text-lg text-white
                           shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Explore Events
                    <FaChevronDown className="group-hover:translate-y-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>

                <motion.a
                  href={event.externalRegistrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 border-2 border-purple-500/50 rounded-full font-semibold text-purple-400
                           hover:bg-purple-500/10 hover:border-purple-400 transition-all duration-300 flex items-center gap-2"
                >
                  Register Now
                  <FaExternalLinkAlt className="text-sm" />
                </motion.a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-purple-400/50 animate-bounce"
        >
          <FaChevronDown className="text-2xl" />
        </motion.div>
      </section>

      {/* ABOUT SECTION */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              About WRANGLEX
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* SUB-EVENTS SECTION */}
      <section ref={eventsSectionRef} className="py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-5xl">
            {/* Event Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full lg:w-1/2 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-500/20 dark:to-blue-500/20 border border-purple-300 dark:border-purple-500/30 rounded-full text-purple-700 dark:text-purple-300 text-sm mb-4">
                <FaTrophy className="text-xs" /> NATIONAL LEVEL TECH FEST
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-3">
                {event.title}
              </h1>

              <p className="text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 font-semibold mb-6">
                {event.tagline}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start text-gray-600 dark:text-gray-300 mb-6">
                <div className="flex items-center gap-2">
                  <FaCalendar className="text-purple-500 dark:text-purple-400" />
                  <span>{format(new Date(event.date), 'MMM d')} – {format(new Date(event.endDate), 'd, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-purple-500 dark:text-purple-400" />
                  <span>{event.location}</span>
                </div>
              </div>

              <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8 max-w-xl">
                {event.description}
              </p>

              <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6">
                {event.tags?.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-xs text-gray-500 dark:text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>

              <a
                href="#events-carousel"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
              >
                Explore Events Below ↓
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SUB-EVENTS CAROUSEL */}
      <section id="events-carousel" className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-100/30 dark:via-purple-900/5 to-transparent" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Events Under WRANGLEX
            </h2>
            <p className="text-gray-400 text-lg">Choose your event and register</p>
          </motion.div>

          <div className="space-y-12">
            {subEvents.map((subEvent: any, index: number) => (
              <motion.div
                key={subEvent.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group relative bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl overflow-hidden
                         hover:border-purple-500/30 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Event Poster */}
                  <div className="relative w-full lg:w-2/5 h-64 lg:h-auto min-h-[280px]">
                    <Image
                      src={subEvent.image}
                      alt={subEvent.title}
                      fill
                      className="object-cover"
                    />
                    {/* Category badge */}
                    <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {subEvent.category.toUpperCase()}
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                        {subEvent.title}
                      </h3>
                      <p className="text-purple-400/80 text-base mb-4">{subEvent.tagline}</p>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                        <FaCalendar className="text-purple-400" />
                        <span>{format(new Date(subEvent.date), 'MMMM dd, yyyy • hh:mm a')}</span>
                      </div>

                      {/* Description */}
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line mb-6 line-clamp-6">
                        {subEvent.description}
                      </p>

                      {/* Pricing */}
                      <div className="flex flex-wrap gap-3 mb-6">
                        {subEvent.tickets.map((ticket: any, i: number) => (
                          <div key={i} className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2">
                            <span className="text-gray-400 text-xs block">{ticket.name}</span>
                            <span className="text-white font-bold text-lg">₹{ticket.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Register Button */}
                    <motion.a
                      href={subEvent.registrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600
                               text-white font-bold rounded-full shadow-lg shadow-purple-500/20
                               hover:shadow-purple-500/40 transition-all duration-300 w-full sm:w-auto text-center"
                    >
                      Register Now
                      <FaExternalLinkAlt className="text-xs" />
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS SECTION */}
      {event.highlights && event.highlights.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Why WRANGLEX?
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {event.highlights.map((highlight: string, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4"
                  >
                    <span className="text-purple-400 mt-0.5">✓</span>
                    <span className="text-gray-300">{highlight}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* VENUE & INFO */}
      <section className="py-16 md:py-24 border-t border-white/[0.06]">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Venue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="text-purple-400" />
                Venue
              </h3>
              <p className="text-gray-300 font-semibold mb-1">{event.venue}</p>
              <p className="text-gray-400">{event.location}</p>
            </motion.div>

            {/* Organizer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Organized By</h3>
              <p className="text-gray-300">{event.organizer}</p>
            </motion.div>
          </div>

          {/* Tags */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <FaTag className="text-gray-500" />
            {event.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 bg-white/[0.05] text-gray-400 text-xs rounded-full border border-white/[0.06]"
              >
                {tag}
              </span>
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              All <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">Events</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Click on any event poster to see details. Register directly for individual events.
            </p>
          </motion.div>

          {/* Carousel Container */}
          <div className="max-w-5xl mx-auto">
            <div
              className="relative"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Main Slide */}
              <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 backdrop-blur-sm shadow-xl dark:shadow-none">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="flex flex-col md:flex-row"
                  >
                    {/* Event Poster with Auto-Slide */}
                    <div className="w-full md:w-1/2 relative">
                      <div className="relative aspect-[3/4] md:aspect-auto md:h-[500px]">
                        {currentEvent && (
                          <AutoSlideImage
                            images={getImages(currentEvent)}
                            alt={currentEvent.name}
                            className="object-cover"
                          />
                        )}
                        {/* Category Badge */}
                        <div className={`absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getCategoryColor(currentEvent?.category || '')}`}>
                          {getCategoryIcon(currentEvent?.category || '')}
                          {currentEvent?.category}
                        </div>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-center">
                      <div className="mb-2 text-gray-400 dark:text-gray-400 text-sm font-medium">
                        Event {currentIndex + 1} of {subEvents.length}
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {currentEvent?.name}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-200 leading-relaxed mb-8 text-base">
                        {currentEvent?.description}
                      </p>

                      <a
                        href={currentEvent?.registrationLink || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 w-full sm:w-auto"
                      >
                        Register Now <FaExternalLinkAlt className="text-sm" />
                      </a>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows */}
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 dark:bg-black/50 backdrop-blur-sm border border-gray-300 dark:border-white/20 flex items-center justify-center text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/20 transition-all z-10"
                  aria-label="Previous event"
                >
                  <FaChevronLeft />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 dark:bg-black/50 backdrop-blur-sm border border-gray-300 dark:border-white/20 flex items-center justify-center text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/20 transition-all z-10"
                  aria-label="Next event"
                >
                  <FaChevronRight />
                </button>
              </div>

              {/* Dot Indicators */}
              <div className="flex justify-center gap-2 mt-6">
                {subEvents.map((_: SubEvent, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleDotClick(i)}
                    className={`transition-all duration-300 rounded-full ${
                      i === currentIndex
                        ? 'w-8 h-3 bg-gradient-to-r from-purple-500 to-blue-500'
                        : 'w-3 h-3 bg-gray-300 dark:bg-white/20 hover:bg-gray-400 dark:hover:bg-white/40'
                    }`}
                    aria-label={`Go to event ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Thumbnail Grid */}
          <div className="max-w-5xl mx-auto mt-10">
            <div className="grid grid-cols-5 gap-3">
              {subEvents.map((sub: SubEvent, i: number) => (
                <button
                  key={i}
                  onClick={() => handleDotClick(i)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    i === currentIndex
                      ? 'border-purple-500 shadow-lg shadow-purple-500/30 scale-105'
                      : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300 dark:hover:border-white/30'
                  }`}
                >
                  <Image
                    src={getImages(sub)[0]}
                    alt={sub.name}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ALL EVENTS GRID */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Quick <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">Register</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400">Jump straight to registration for any event</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-7xl mx-auto">
            {subEvents.map((sub: SubEvent, i: number) => (
              <motion.a
                key={i}
                href={sub.registrationLink}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 shadow-sm dark:shadow-none"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <AutoSlideImage
                    images={getImages(sub)}
                    alt={sub.name}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className={`absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold text-white bg-gradient-to-r ${getCategoryColor(sub.category)}`}>
                    {getCategoryIcon(sub.category)}
                    {sub.category}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="text-gray-900 dark:text-white font-semibold text-sm mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                    {sub.name}
                  </h4>
                  <p className="text-gray-500 text-xs line-clamp-2 mb-3">
                    {sub.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400 group-hover:text-purple-500 dark:group-hover:text-purple-300">
                    Register <FaExternalLinkAlt className="text-[10px]" />
                  </span>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 text-center">
      {/* Footer CTA */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Participate?</h2>
            <p className="text-gray-400 mb-8 text-lg">Register now for WRANGLEX events</p>
            <motion.a
              href={event.externalRegistrationLink}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full
                       font-bold text-lg text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300"
            >
              Register for WRANGLEX
              <FaExternalLinkAlt />
            </motion.a>
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Compete?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Visit the official WRANGLEX website for complete event details, rules, and registration.
            </p>
            <a
              href="https://datawranglers-jbiet.in/wranglex/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 text-lg"
            >
              Visit WRANGLEX Website <FaExternalLinkAlt />
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
