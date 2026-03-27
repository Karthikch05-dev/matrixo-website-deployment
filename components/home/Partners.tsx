'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

const partners = [
  { name: 'Smartzy Edu Pvt. Ltd.', logo: '/logos/smartzy.png', noBg: true },
  { name: 'TEDxIARE', logo: '/logos/Tedxiare.png', darkBg: true },
  { name: 'TEDxCMRIT Hyderabad', logo: '/logos/Tedxcmrit.png', darkBg: true },
  { name: 'Kommuri Pratap Reddy Institute of Technology', logo: '/partners/kprit.png', darkBg: true },
  { name: 'TEDxKPRIT', logo: '/events/tedxkprit-logo.png' },
  { name: 'J B Institute of Engineering and Technology', logo: '/logos/jbiet.png' },
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              className="group flex flex-col items-center justify-center p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:border-blue-400 hover:shadow-xl h-full"
            >
              {partner.noBg ? (
                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                  <PartnerLogo name={partner.name} logo={partner.logo} className="object-contain w-20 h-20" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-4 overflow-hidden transition-colors duration-300 group-hover:bg-blue-500/20">
                  <PartnerLogo name={partner.name} logo={partner.logo} className="object-contain w-16 h-16" />
                </div>
              )}
              <p className="text-sm text-gray-300 text-center">
                {partner.name}
              </p>
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
            className="btn-primary inline-flex items-center transform hover:scale-[1.03]"
          >
            Contact Us
          </a>
        </motion.div>
      </div>
    </section>
  )
}

function PartnerLogo({
  name,
  logo,
  className,
}: {
  name: string
  logo: string
  className: string
}) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <span className="text-2xl font-bold text-gray-400">{name.charAt(0)}</span>
  }
  return (
    <img
      src={logo}
      alt={name}
      width={80}
      height={80}
      onError={() => setFailed(true)}
      className={className}
    />
  )
}
