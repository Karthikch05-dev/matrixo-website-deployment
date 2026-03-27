'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const partners = [
  { name: 'Smartzy Edu Pvt. Ltd.', logo: '/logos/smartzy.png' },
  { name: 'TEDxIARE', logo: '/partners/iare.png' },
  { name: 'TEDxCMRIT Hyderabad', logo: '/partners/cmrit.png' },
  { name: 'Kommuri Pratap Reddy Institute of Technology', logo: '/partners/kprit.png' },
  { name: 'TEDxKPRIT', logo: '/partners/tedxkprit.png' },
  { name: 'J B Institute of Engineering and Technology', logo: '/partners/jbiet.png' },
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 items-stretch">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col items-center justify-center px-5 py-8 glass-card hover-lift transition-shadow duration-300"
            >
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white mx-auto">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={60}
                  height={60}
                  className="w-[60px] h-[60px] object-contain"
                />
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center leading-snug mt-2">
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
