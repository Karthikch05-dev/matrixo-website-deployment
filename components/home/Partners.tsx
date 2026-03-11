'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const partners = [
  { name: 'Smartzy Edu Pvt. Ltd.', logo: '/partners/smartzy.png' },
  { name: 'TEDxIARE', logo: '/partners/tedx-iare.png' },
  { name: 'TEDxCMRIT Hyderabad', logo: '/partners/tedx-cmrit.png' },
  { name: 'Kommuri Pratap Reddy Institute of Technology', logo: '/partners/kprit.png' },
  { name: 'TEDxKPRIT', logo: '/events/tedxkprit-logo.png' },
]

export default function Partners() {
  return (
    <section className="section-padding bg-transparent">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            <span className="gradient-text">Trusted By</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Partnering with leading educational institutions and event organizers across India.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 items-stretch">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-center justify-center px-5 py-8 glass-card hover-lift transition-shadow duration-300"
            >
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center leading-snug">
                {partner.name}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Partnership CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-16 text-center glass-card p-8"
        >
          <h3 className="text-2xl font-bold mb-4 gradient-text">
            Interested in Partnering with Us?
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Join our growing network of educational institutions and event organizers
          </p>
          <a
            href="/contact"
            className="btn-primary inline-flex items-center"
          >
            Contact Us
          </a>
        </motion.div>
      </div>
    </section>
  )
}
