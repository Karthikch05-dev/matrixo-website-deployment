'use client'

import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useTheme } from 'next-themes'

type Partner = {
  name: string
  logoLight: string
  logoDark: string
  logoClassName?: string
}

const partners: Partner[] = [
  {
    name: 'Smartzy Edu Pvt. Ltd.',
    logoLight: '/partners/smartzy.png',
    logoDark: '/logos/smartzy.png',
  },
  {
    name: 'TEDxIARE',
    logoLight: '/logos/tedxiare-light.jpg',
    logoDark: '/partners/tedx-iare.png',
    logoClassName: 'h-10 w-full max-w-full object-contain origin-center scale-[2]',
  },
  {
    name: 'TEDxCMRIT Hyderabad',
    logoLight: '/logos/tedxcmrit-light.jpg',
    logoDark: '/partners/tedx-cmrit.png',
    logoClassName: 'h-10 w-full max-w-full object-contain origin-center scale-[2]',
  },
  {
    name: 'Kommuri Pratap Reddy Institute of Technology',
    logoLight: '/partners/kprit-light.png',
    logoDark: '/partners/kprit.png',
  },
  {
    name: 'TEDxKPRIT',
    logoLight: '/partners/tedxkprit-light.png',
    logoDark: '/logos/tedxkprit-dark.png',
    logoClassName: 'h-10 w-full max-w-full object-contain origin-center scale-[2.5] dark:scale-100',
  },
  {
    name: 'J B Institute of Engineering and Technology',
    logoLight: '/logos/jbiet.png',
    logoDark: '/logos/jbiet.png',
  },
]

const SHOW_COLLAB_LOGOS = false

export default function Partners() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <section className="section-padding py-16 transition-colors duration-500">
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {partners.map((partner, index) => (
            <PartnerCard
              key={partner.name}
              partner={partner}
              index={index}
              isDark={isDark}
              showLogo={SHOW_COLLAB_LOGOS}
            />
          ))}
        </div>

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

function PartnerCard({
  partner,
  index,
  isDark,
  showLogo,
}: {
  partner: Partner
  index: number
  isDark: boolean
  showLogo: boolean
}) {
  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.45 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group h-full rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-5 md:p-6 shadow-md hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500/60 transition-all duration-300"
    >
      <div className={`h-full flex flex-col items-center justify-center text-center ${showLogo ? 'gap-4' : 'gap-0'}`}>
        {showLogo ? (
          <div className="w-full h-12 flex items-center justify-center overflow-hidden">
            <PartnerLogo partner={partner} isDark={isDark} />
          </div>
        ) : null}

        <h3 className="text-sm md:text-[15px] font-semibold leading-snug text-gray-800 dark:text-gray-200 min-h-[2.75rem] flex items-center justify-center px-1">
          {partner.name}
        </h3>
      </div>
    </motion.article>
  )
}

function PartnerLogo({
  partner,
  isDark,
}: {
  partner: Partner
  isDark: boolean
}) {
  const [sourceIndex, setSourceIndex] = useState(0)

  const logoSources = useMemo(() => {
    const preferred = isDark
      ? [partner.logoDark, partner.logoLight]
      : [partner.logoLight, partner.logoDark]

    return preferred.filter((item): item is string => Boolean(item))
  }, [isDark, partner.logoDark, partner.logoLight])

  const logo = logoSources[sourceIndex]

  useEffect(() => {
    setSourceIndex(0)
  }, [isDark, partner.logoDark, partner.logoLight])

  if (!logo) return null

  const handleError = () => {
    if (sourceIndex < logoSources.length - 1) {
      setSourceIndex((prev) => prev + 1)
    }
  }

  return (
    <img
      src={logo}
      alt={partner.name}
      width={120}
      height={40}
      onError={handleError}
      className={partner.logoClassName || 'h-10 w-auto max-w-full object-contain'}
    />
  )
}
