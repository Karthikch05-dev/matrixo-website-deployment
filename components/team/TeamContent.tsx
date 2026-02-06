'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaLinkedin, FaEnvelope } from 'react-icons/fa'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'

interface TeamMember {
  employeeId: string
  name: string
  email: string
  department: string
  designation: string
  joiningDate: string
  profileImage: string
  role: string
  linkedin?: string
}

// Define role priority for sorting (Founders & Co-Founders first, then HR & MD, then employees)
const rolePriority: Record<string, number> = {
  'Founder': 0,
  'Co-Founder': 1,
  'HR': 2,
  'MD': 3,
  'Managing Director': 3,
  'admin': 4,
  'employee': 5,
  'Intern': 6,
}

function getRolePriority(role: string): number {
  return rolePriority[role] ?? 5
}

// Display-friendly role label
function getDisplayRole(member: TeamMember): string {
  if (member.designation) return member.designation
  if (member.role === 'admin') return 'Admin'
  if (member.role === 'Intern') return 'Intern'
  if (member.role === 'employee') return 'Team Member'
  return member.role
}

// LinkedIn mapping by name keywords (fallback if not stored in Firestore)
const linkedinMap: Record<string, string> = {
  'lahari': 'https://www.linkedin.com/in/lahari-rami-reddy-950352262',
  'yasasvi': 'https://www.linkedin.com/in/yasasvi-mandapati',
  'shiva': 'https://www.linkedin.com/in/shivaganesht',
  'kishan': 'https://www.linkedin.com/in/kishan-sai-vutukuri',
  'vinod': 'https://www.linkedin.com/in/vinod-kethavath-2733a5317',
  'karthik': 'https://www.linkedin.com/in/karthik-chinthakindi-aa93a7287',
  'jahnavi': 'https://www.linkedin.com/in/jahnavi-mulukutla',
  'shravya': 'https://www.linkedin.com/in/shravya-datla-388447287',
}

function getLinkedin(name: string, firestoreLinkedin?: string): string {
  if (firestoreLinkedin) return firestoreLinkedin
  const nameLower = name.toLowerCase()
  for (const [key, url] of Object.entries(linkedinMap)) {
    if (nameLower.includes(key)) return url
  }
  return ''
}

export default function TeamContent() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeesRef = collection(db, 'Employees')
        const q = query(employeesRef)
        const querySnapshot = await getDocs(q)
        
        const members: TeamMember[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          // Skip the Admin account from the team page
          if (data.name === 'Admin' || data.employeeId === 'Admin' || data.role === 'admin' && !data.designation) return
          const name = data.name || ''
          members.push({
            employeeId: data.employeeId || doc.id,
            name: name,
            email: data.email || '',
            department: data.department || '',
            designation: data.designation || '',
            joiningDate: data.joiningDate || '',
            profileImage: data.profileImage || '',
            role: data.role || 'employee',
            linkedin: getLinkedin(name, data.linkedin),
          })
        })

        // Sort: Founders first, then Co-Founders, then admins, then employees, then interns
        members.sort((a, b) => {
          const priorityA = getRolePriority(a.designation || a.role)
          const priorityB = getRolePriority(b.designation || b.role)
          if (priorityA !== priorityB) return priorityA - priorityB
          return a.name.localeCompare(b.name)
        })

        setTeamMembers(members)
      } catch (error) {
        console.error('Error fetching team members:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  return (
    <div className="min-h-screen pt-0">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white section-padding">
        <div className="container-custom px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
              Meet Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">Team</span>
            </h1>
            <p className="text-2xl text-gray-300">
              The passionate individuals building the future of technical education
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="section-padding bg-white dark:bg-gray-950">
        <div className="container-custom px-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={member.employeeId}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.5 }}
                  className="glass-card p-8 hover-lift hover-glow text-center"
                >
                  {/* Avatar - Image with fallback to initials */}
                  <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden 
                                bg-gradient-to-br from-blue-500 to-purple-600">
                    {member.profileImage ? (
                      <img 
                        src={member.profileImage} 
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const parent = e.currentTarget.parentElement
                          if (parent && !parent.querySelector('.initials-fallback')) {
                            const fallback = document.createElement('div')
                            fallback.className = 'initials-fallback absolute inset-0 flex items-center justify-center text-white text-4xl font-bold'
                            fallback.textContent = member.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()
                            parent.appendChild(fallback)
                          }
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white text-4xl font-bold">
                        {member.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                    {member.name}
                  </h3>
                  <p className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 font-medium mb-2">
                    {getDisplayRole(member)}
                  </p>
                  {member.department && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                      {member.department}
                    </p>
                  )}

                  {/* Social Links */}
                  <div className="flex justify-center space-x-4 mt-4">
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center 
                                 hover:bg-gradient-to-br hover:from-blue-500 hover:to-purple-600 hover:text-white 
                                 transition-all duration-300"
                      >
                        <FaLinkedin size={20} />
                      </a>
                    )}
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center 
                                 hover:bg-gradient-to-br hover:from-blue-500 hover:to-purple-600 hover:text-white 
                                 transition-all duration-300"
                      >
                        <FaEnvelope size={20} />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="section-padding bg-gray-50 dark:bg-gray-900">
        <div className="container-custom px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center glass-card p-12 max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 gradient-text">
              Want to Join Our Team?
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              We&apos;re always looking for talented individuals who share our passion for education and technology.
            </p>
            <a href="mailto:hello@matrixo.in?subject=Open%20Position%20Inquiry">
              <button className="btn-primary">
                View Open Positions
              </button>
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
