'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaLinkedin, FaInstagram } from 'react-icons/fa'
import { toast } from 'sonner'

// Maps URL subject parameter to dropdown value
const SUBJECT_MAPPING: Record<string, string> = {
  'Technical Workshops': 'workshops',
  'Hackathons': 'hackathons',
  'Bootcamps': 'bootcamps',
  'Career Programs': 'career',
  'Campus Events': 'campus',
  'Corporate Collaboration': 'partnership',
}

// Pre-fill messages based on service type
const MESSAGE_TEMPLATES: Record<string, string> = {
  'workshops': 'Hi, I am interested in learning more about your Technical Workshops. Please share details about upcoming sessions, topics covered, and pricing.',
  'hackathons': 'Hi, I would like to know more about participating in or hosting a hackathon with matriXO. Please share the details.',
  'bootcamps': 'Hi, I am interested in enrolling in one of your Bootcamp programs. Please share information about curriculum, duration, and fees.',
  'career': 'Hi, I am interested in your Career Programs for placement preparation. Please provide more details.',
  'campus': 'Hi, I would like to host a Campus Event at our institution. Please share the available options and pricing.',
}

export default function ContactContent() {
  const searchParams = useSearchParams()
  const formRef = useRef<HTMLFormElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const subjectParam = searchParams.get('subject')
    if (subjectParam) {
      const mappedSubject = SUBJECT_MAPPING[subjectParam]
      if (mappedSubject) {
        const messageTemplate = MESSAGE_TEMPLATES[mappedSubject] || ''
        setFormData(prev => ({ 
          ...prev, 
          subject: mappedSubject,
          message: messageTemplate,
        }))
        
        // Scroll to form after a small delay for smooth UX
        setTimeout(() => {
          formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 300)
      }
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
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
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
    <div className="min-h-screen pt-0">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-black text-gray-900 dark:text-white section-padding overflow-hidden">
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -left-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="container-custom px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold mb-4 sm:mb-6">
              Get In <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300">
              Have questions? We&apos;d love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-padding bg-transparent">
        <div className="container-custom px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-3xl font-bold mb-8 gradient-text">Send Us a Message</h2>
              <form id="contact-form" ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl glass-input"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl glass-input"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl glass-input"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Subject *
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl glass-input bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Select a subject</option>
                    <option value="workshops" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Technical Workshops</option>
                    <option value="hackathons" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Hackathons</option>
                    <option value="bootcamps" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Bootcamps</option>
                    <option value="career" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Career Programs</option>
                    <option value="campus" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Campus Events</option>
                    <option value="general" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">General Inquiry</option>
                    <option value="event" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">List an Event</option>
                    <option value="partnership" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Partnership / Corporate</option>
                    <option value="support" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Technical Support</option>
                    <option value="other" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl glass-input resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Contact Information</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 glass-card p-6">
                    <FaEnvelope className="text-2xl text-neon-blue flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold mb-1 text-gray-900 dark:text-white">Email</h3>
                      <a href="mailto:hello@matrixo.in" className="text-gray-600 dark:text-gray-400 hover:text-neon-blue">
                        hello@matrixo.in
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 glass-card p-6">
                    <FaPhone className="text-2xl text-neon-purple flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold mb-1 text-gray-900 dark:text-white">Phone</h3>
                      <a href="tel:+918297024365" className="text-gray-600 dark:text-gray-400 hover:text-neon-purple">
                        +91 82970 24365
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 glass-card p-6">
                    <FaMapMarkerAlt className="text-2xl text-neon-pink flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold mb-1 text-gray-900 dark:text-white">Address</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        25, Heaven Down Residency<br />
                        RTC Colony, Nagaram<br />
                        Hyderabad, Telangana - 501302
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="glass-card p-6">
                <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Follow Us</h3>
                <div className="flex space-x-4">
                  <a
                    href="https://linkedin.com/company/matrixo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 glass-chip flex items-center justify-center 
                             hover:bg-gradient-to-br hover:from-neon-blue hover:to-neon-purple hover:text-white 
                             transition-all duration-300"
                  >
                    <FaLinkedin size={24} />
                  </a>
                  <a
                    href="https://www.instagram.com/matrixo_in?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 glass-chip flex items-center justify-center 
                             hover:bg-gradient-to-br hover:from-neon-blue hover:to-neon-purple hover:text-white 
                             transition-all duration-300"
                  >
                    <FaInstagram size={24} />
                  </a>
                </div>
              </div>

              {/* Business Hours */}
              <div className="glass-card p-6">
                <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Business Hours</h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span className="font-medium">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday:</span>
                    <span className="font-medium">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday:</span>
                    <span className="font-medium">Closed</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
