'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { FaBug, FaEnvelope, FaMapMarkerAlt, FaPhone } from 'react-icons/fa'
import HeadingHighlight from '../HeadingHighlight'

const serviceSubjectOptions = [
  'Technical Workshops',
  'Hackathons',
  'Bootcamps',
  'Career Programs',
  'Campus Events',
  'Corporate Collaboration',
]

const contactInfoCards = [
  {
    title: 'Email Us',
    value: 'hello@matrixo.in',
    icon: FaEnvelope,
  },
  {
    title: 'Call Us',
    value: '+91 99XXXXXX88',
    icon: FaPhone,
  },
  {
    title: 'Our Location',
    value: 'Ghanapur, Hyderabad, India',
    icon: FaMapMarkerAlt,
  },
]

export default function ContactContent() {
  const searchParams = useSearchParams()
  const inputClassName =
    'w-full h-[54px] bg-transparent border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-400 transition-all duration-300 focus:border-blue-300/60 focus:ring-2 focus:ring-blue-500/40 focus:shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:border-blue-300/40 hover:shadow-[0_0_18px_rgba(96,165,250,0.16)]'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const typeParam = searchParams.get('type')
    if (!typeParam) {
      return
    }

    let decodedType = typeParam
    try {
      decodedType = decodeURIComponent(typeParam)
    } catch {
      decodedType = typeParam
    }

    if (serviceSubjectOptions.includes(decodedType)) {
      setFormData((prev) => ({ ...prev, subject: decodedType }))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Thank you for your message! We\'ll get back to you soon.')
        const typeParam = searchParams.get('type')
        let decodedType = ''
        if (typeParam) {
          try {
            decodedType = decodeURIComponent(typeParam)
          } catch {
            decodedType = typeParam
          }
        }

        const preselectedSubject = serviceSubjectOptions.includes(decodedType) ? decodedType : ''
        setFormData({ name: '', email: '', phone: '', subject: preselectedSubject, message: '' })
      } else {
        toast.error(data.error || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="relative isolate h-screen w-full overflow-hidden">
      <div className="absolute top-4 left-4 z-50">
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white text-sm hover:bg-white/20 transition"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="absolute inset-0 -z-10 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-40 brightness-90 contrast-110 saturate-125"
        >
          <source src="/backgrounds/mesh.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#020617]/90 via-[#07142c]/70 to-[#132a66]/50" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_35%,rgba(59,130,246,0.2),transparent_60%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_70%,rgba(96,165,250,0.14),transparent_55%)]" />
      <div className="absolute inset-y-0 left-0 -z-10 w-[55%] bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_55%_at_30%_35%,#000_55%,transparent_100%)]" />
      <div className="absolute inset-y-0 right-0 -z-10 w-[58%] bg-gradient-to-l from-[#020617] via-[#020617]/95 to-transparent" />

      <main className="relative z-10 flex h-full items-start px-[clamp(1.25rem,4vw,5rem)] py-[clamp(1.25rem,3vh,2.5rem)]">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-12">
          <div className="relative z-10 w-full max-w-[560px]">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="relative w-full"
            >
              <div className="pointer-events-none absolute -inset-6 rounded-[28px] bg-[radial-gradient(circle_at_25%_15%,rgba(59,130,246,0.28),transparent_65%)] blur-2xl" />
              <motion.div
                initial={{ opacity: 0, y: 22, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative w-full h-auto space-y-4 rounded-2xl border border-white/10 bg-[#0a0f2c]/55 px-6 pb-5 pt-6 shadow-[0_22px_60px_rgba(2,6,23,0.5)] backdrop-blur-xl"
              >
                <h2 className="mb-1.5 text-2xl font-semibold text-white">
                  <HeadingHighlight text="Let's Connect" solidClassName="text-white" />
                </h2>

                <form onSubmit={handleSubmit} className="w-full space-y-3 pb-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-200">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={inputClassName}
                      placeholder="Abhishek Kumar"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-200">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={inputClassName}
                      placeholder="abhishek@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-200">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={inputClassName}
                      placeholder="+91 99XXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-200">
                      Subject *
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className={`${inputClassName} appearance-none`}
                    >
                      <option value="" className="bg-[#0f1737] text-gray-200">Select a subject</option>
                      {serviceSubjectOptions.map((option) => (
                        <option key={option} value={option} className="bg-[#0f1737] text-gray-200">
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-200">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={3}
                      className={`${inputClassName} h-[110px] min-h-[110px] max-h-[110px] resize-none`}
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <div className="mt-0.5 flex justify-center">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex h-[46px] w-fit max-w-full items-center justify-center rounded-full border border-white/10 bg-slate-700/70 px-6 text-sm font-medium text-white transition-colors duration-300 hover:bg-slate-600/80"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="relative w-full max-w-[440px] lg:justify-self-end"
          >
            <div className="space-y-5">
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.05] tracking-tight">
                  <HeadingHighlight text="We're Here To Help You" highlightWords={3} solidClassName="text-white" />
                </h1>
                <div className="mt-4 h-px w-24 bg-gradient-to-r from-blue-400/80 via-blue-300/40 to-transparent shadow-[0_0_16px_rgba(96,165,250,0.4)]" />
              </div>

              <Link
                href="mailto:hello@matrixo.in?subject=Bug%20Report"
                className="group inline-flex items-center gap-2.5 rounded-full border border-blue-300/30 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-100/80 shadow-[0_8px_20px_rgba(2,6,23,0.35)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300/60 hover:bg-white/10 hover:shadow-[0_12px_26px_rgba(59,130,246,0.22)]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/10 text-blue-100 shadow-[0_0_14px_rgba(59,130,246,0.2)] transition-all duration-300 group-hover:border-blue-300/50 group-hover:text-white">
                  <FaBug className="text-[11px]" />
                </span>
                Report a Bug
              </Link>

              <p className="text-sm leading-relaxed text-blue-100/70 max-w-[400px]">
                Have a question, idea, or project in mind? Let's build something great together.
              </p>

              <div className="grid gap-3">
                {contactInfoCards.map((item) => (
                  <div
                    key={item.title}
                    className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-[1.1rem] py-3.5 shadow-[0_12px_26px_rgba(2,6,23,0.42)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-white/10 hover:shadow-[0_16px_34px_rgba(59,130,246,0.18)]"
                  >
                    <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-[0_0_18px_rgba(59,130,246,0.2)] transition-all duration-300 group-hover:border-blue-300/40 group-hover:text-white">
                      <item.icon className="text-[15px]" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100/60">
                        {item.title}
                      </p>
                      <p className="text-sm font-medium text-white/90">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
