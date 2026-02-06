'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaBriefcase, FaMapMarkerAlt, FaClock, FaArrowRight } from 'react-icons/fa'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import Link from 'next/link'

interface Role {
  id: string
  title: string
  description: string
  team: string
  location: string
  type: string
  status: 'open' | 'closed'
  createdAt: any
}

export default function CareersContent() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOpenRoles = async () => {
      try {
        const rolesRef = collection(db, 'roles')
        const q = query(
          rolesRef,
          where('status', '==', 'open'),
          orderBy('createdAt', 'desc')
        )
        const querySnapshot = await getDocs(q)
        
        const fetchedRoles: Role[] = []
        querySnapshot.forEach((doc) => {
          fetchedRoles.push({ id: doc.id, ...doc.data() } as Role)
        })
        
        setRoles(fetchedRoles)
      } catch (error) {
        console.error('Error fetching roles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOpenRoles()
  }, [])

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white py-20">
        <div className="container-custom px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
              Carrier<span className="text-cyan-400">@</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">matriXO</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Join matriXO and help shape the future of technical education
            </p>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              We're building innovative solutions that empower students and educational institutions. 
              Be part of a team that's making a real difference in how people learn and grow.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Open Roles Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container-custom px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Open Positions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Discover opportunities that match your skills and passion
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : roles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <FaBriefcase className="text-6xl text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                No Open Positions Right Now
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                We don't have any openings at the moment, but we're always looking for talented individuals.
                Feel free to send us your resume at careers@matrixo.in
              </p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {roles.map((role, index) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-6 hover-lift hover-glow group"
                >
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-cyan-500 transition-colors">
                      {role.title}
                    </h3>
                    <p className="text-cyan-600 dark:text-cyan-400 font-medium mb-4">
                      {role.team}
                    </p>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3">
                    {role.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <FaMapMarkerAlt className="mr-2 text-cyan-500" />
                      {role.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <FaClock className="mr-2 text-cyan-500" />
                      {role.type}
                    </div>
                  </div>

                  <Link href={`/careers/apply/${role.id}`}>
                    <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 flex items-center justify-center group">
                      Apply Now
                      <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container-custom px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Why Join matriXO?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: 'Impact at Scale',
                description: 'Work on products that directly impact thousands of students and educational institutions.',
                icon: '🚀',
              },
              {
                title: 'Innovation First',
                description: 'Be at the forefront of EdTech innovation with AI, blockchain, and cutting-edge technologies.',
                icon: '💡',
              },
              {
                title: 'Growth & Learning',
                description: 'Continuous learning opportunities, mentorship, and career development programs.',
                icon: '📈',
              },
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-8 text-center"
              >
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
