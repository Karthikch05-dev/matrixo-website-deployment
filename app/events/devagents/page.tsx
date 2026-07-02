'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { FaArrowLeft, FaRobot, FaCode, FaUsers, FaCalendar, FaMapMarkerAlt } from 'react-icons/fa'

// Lazy-load the form so the heavy FileReader / framer-motion code is split
const DevAgentsRegistrationForm = dynamic(
  () => import('@/components/events/DevAgentsRegistrationForm'),
  { ssr: false }
)

export default function DevAgentsPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-gray-950 to-purple-900/30" />
        <div className="relative max-w-4xl mx-auto text-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors"
          >
            <FaArrowLeft /> Back to Events
          </Link>

          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-300 text-sm mb-6">
            <FaRobot /> AI &amp; Dev Workshop
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold gradient-text mb-4">
            DevAgents
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            Build real-world AI agents, collaborate with developers, and ship projects that matter.
            Limited seats — register now to secure your spot.
          </p>

          {/* Quick meta */}
          <div className="flex flex-wrap justify-center gap-6 text-gray-400 text-sm mb-10">
            <span className="flex items-center gap-1.5">
              <FaCalendar className="text-blue-400" /> TBA
            </span>
            <span className="flex items-center gap-1.5">
              <FaMapMarkerAlt className="text-blue-400" /> Hyderabad
            </span>
            <span className="flex items-center gap-1.5">
              <FaUsers className="text-blue-400" /> Limited Seats
            </span>
            <span className="flex items-center gap-1.5">
              <FaCode className="text-blue-400" /> All Skill Levels
            </span>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-lg px-8 py-4"
          >
            Register Now
          </button>
        </div>
      </section>

      {/* Registration form modal */}
      {showForm && (
        <DevAgentsRegistrationForm onClose={() => setShowForm(false)} />
      )}
    </main>
  )
}
