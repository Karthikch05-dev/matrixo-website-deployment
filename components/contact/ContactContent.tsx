'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'

const serviceSubjectOptions = [
  'Technical Workshops',
  'Hackathons',
  'Bootcamps',
  'Career Programs',
  'Campus Events',
  'Corporate Collaboration',
]

export default function ContactContent() {
  const searchParams = useSearchParams()
  const inputClassName =
    'w-full bg-transparent border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-blue-300/40 hover:shadow-[0_0_18px_rgba(96,165,250,0.18)]'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [])

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
    <div className="relative isolate h-screen w-screen flex flex-col overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-60 brightness-90 contrast-110 saturate-125 -z-10"
        >
          <source src="/backgrounds/mesh.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#020617]/80 via-[#0a1a3a]/60 to-[#1e3a8a]/40" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.25),transparent_60%)]" />

      <main className="relative z-10 min-h-screen flex items-start justify-end pt-20 pr-6 pl-6 md:pt-24 md:pr-10 md:pl-10">
        <div className="relative z-10 w-full max-w-md ml-auto mt-2">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full"
          >
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-full h-auto overflow-visible space-y-3 rounded-2xl border border-white/10 bg-[#0a0f2c]/50 p-5 backdrop-blur-xl"
            >
                <h2 className="mb-1 text-xl font-semibold text-white">Let's Connect</h2>

                <form onSubmit={handleSubmit} className="space-y-3">
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
                      className={`${inputClassName} resize-none`}
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-2xl text-white font-medium border border-white/20 bg-[linear-gradient(90deg,#050C4F,#31387D,#A0A1B8)] bg-[length:200%_100%] bg-left hover:bg-right transition-all duration-500 ease-in-out"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
