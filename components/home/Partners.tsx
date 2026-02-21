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
    <section className="section-padding bg-white dark:bg-gray-950">
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="flex items-center justify-center p-6 bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-white/[0.06] shadow-sm hover:shadow-lg hover:shadow-gray-100/50 dark:hover:shadow-none transition-all duration-300"
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-3 bg-gray-100 dark:bg-white/[0.06] rounded-full flex items-center justify-center text-3xl font-bold text-gray-900 dark:text-white">
                  {partner.name.charAt(0)}
                </div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight">
                  {partner.name}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Partnership CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
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
            className="inline-flex items-center px-8 py-3 bg-gray-900 dark:bg-white 
                     text-white dark:text-gray-900 rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 hover:shadow-lg transition-all duration-200
                     transform hover:scale-[1.03]"
          >
            Contact Us
          </a>
        </motion.div>
      </div>
    </section>
  )
}
