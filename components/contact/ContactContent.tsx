'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaLinkedin, FaInstagram } from 'react-icons/fa'
import { toast } from 'sonner'

export default function ContactContent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white section-padding">
        <div className="container-custom px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold mb-4 sm:mb-6">
              Get In <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300">
              Have questions? We&apos;d love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-padding bg-white dark:bg-gray-950">
        <div className="container-custom px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-3xl font-bold mb-8 gradient-text">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 
                             dark:border-gray-800 focus:border-neon-blue focus:outline-none transition-colors 
                             text-gray-900 dark:text-white"
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
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 
                             dark:border-gray-800 focus:border-neon-blue focus:outline-none transition-colors
                             text-gray-900 dark:text-white"
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
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 
                             dark:border-gray-800 focus:border-neon-blue focus:outline-none transition-colors
                             text-gray-900 dark:text-white"
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
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 
                             dark:border-gray-800 focus:border-neon-blue focus:outline-none transition-colors
                             text-gray-900 dark:text-white"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="event">List an Event</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="support">Technical Support</option>
                    <option value="other">Other</option>
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
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 
                             dark:border-gray-800 focus:border-neon-blue focus:outline-none transition-colors
                             text-gray-900 dark:text-white resize-none"
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
                    className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center 
                             hover:bg-gradient-to-br hover:from-neon-blue hover:to-neon-purple hover:text-white 
                             transition-all duration-300"
                  >
                    <FaLinkedin size={24} />
                  </a>
                  <a
                    href="https://instagram.com/matrixo_official"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center 
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
