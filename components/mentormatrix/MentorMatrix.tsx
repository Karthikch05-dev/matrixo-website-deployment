'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaUserTie, FaStar, FaVideo, FaCalendar, FaCode, FaPalette, FaChartLine, FaRocket, FaMicrophone, FaGraduationCap, FaLinkedin, FaGithub, FaTwitter, FaHeart, FaCheckCircle, FaClock, FaUsers, FaAward } from 'react-icons/fa'

interface Mentor {
  id: string
  name: string
  title: string
  company: string
  avatar: string
  expertise: string[]
  rating: number
  totalSessions: number
  responseTime: string
  languages: string[]
  about: string
  matchScore: number
  price: number
  availability: 'available' | 'busy' | 'booked'
  social: {
    linkedin?: string
    github?: string
    twitter?: string
  }
}

const mentors: Mentor[] = [
  {
    id: 'mentor1',
    name: 'Priya Sharma',
    title: 'Senior Full-Stack Developer',
    company: 'Google',
    avatar: '👩‍💻',
    expertise: ['React', 'Node.js', 'System Design', 'Career Growth'],
    rating: 4.9,
    totalSessions: 156,
    responseTime: '< 2 hours',
    languages: ['English', 'Hindi'],
    about: 'Ex-Microsoft engineer with 8+ years experience. Passionate about mentoring aspiring developers.',
    matchScore: 98,
    price: 2500,
    availability: 'available',
    social: {
      linkedin: 'priya-sharma',
      github: 'priyasharma',
      twitter: 'priya_codes',
    },
  },
  {
    id: 'mentor2',
    name: 'Rajesh Kumar',
    title: 'Principal UI/UX Designer',
    company: 'Adobe',
    avatar: '👨‍🎨',
    expertise: ['UI/UX Design', 'Figma', 'Design Systems', 'User Research'],
    rating: 4.8,
    totalSessions: 203,
    responseTime: '< 3 hours',
    languages: ['English', 'Tamil'],
    about: 'Award-winning designer specializing in creating delightful user experiences.',
    matchScore: 92,
    price: 3000,
    availability: 'available',
    social: {
      linkedin: 'rajesh-kumar-design',
      twitter: 'rajesh_ux',
    },
  },
  {
    id: 'mentor3',
    name: 'Ananya Reddy',
    title: 'Data Science Lead',
    company: 'Amazon',
    avatar: '👩‍🔬',
    expertise: ['Machine Learning', 'Python', 'AI', 'Data Analytics'],
    rating: 5.0,
    totalSessions: 89,
    responseTime: '< 4 hours',
    languages: ['English', 'Telugu'],
    about: 'PhD in AI/ML. Helping students break into data science careers.',
    matchScore: 85,
    price: 3500,
    availability: 'busy',
    social: {
      linkedin: 'ananya-reddy-ds',
      github: 'ananya-ml',
    },
  },
  {
    id: 'mentor4',
    name: 'Vikram Singh',
    title: 'Tech Startup Founder',
    company: 'Startup Mentor',
    avatar: '👨‍💼',
    expertise: ['Entrepreneurship', 'Product Strategy', 'Fundraising', 'Growth'],
    rating: 4.7,
    totalSessions: 124,
    responseTime: '< 6 hours',
    languages: ['English', 'Punjabi'],
    about: 'Built 2 successful startups. Mentor at Y Combinator and Techstars.',
    matchScore: 78,
    price: 5000,
    availability: 'available',
    social: {
      linkedin: 'vikram-singh-founder',
      twitter: 'vikram_startup',
    },
  },
  {
    id: 'mentor5',
    name: 'Sneha Patel',
    title: 'DevOps Architect',
    company: 'Microsoft',
    avatar: '👩‍💻',
    expertise: ['DevOps', 'Cloud (AWS/Azure)', 'Kubernetes', 'CI/CD'],
    rating: 4.9,
    totalSessions: 142,
    responseTime: '< 3 hours',
    languages: ['English', 'Gujarati'],
    about: 'Cloud-native enthusiast helping teams scale infrastructure efficiently.',
    matchScore: 88,
    price: 2800,
    availability: 'available',
    social: {
      linkedin: 'sneha-patel-devops',
      github: 'sneha-cloud',
    },
  },
  {
    id: 'mentor6',
    name: 'Arjun Mehta',
    title: 'Mobile App Developer',
    company: 'Meta',
    avatar: '👨‍💻',
    expertise: ['React Native', 'iOS', 'Android', 'Mobile Design'],
    rating: 4.8,
    totalSessions: 178,
    responseTime: '< 2 hours',
    languages: ['English', 'Marathi'],
    about: 'Built apps used by millions. Specializing in cross-platform development.',
    matchScore: 82,
    price: 2200,
    availability: 'booked',
    social: {
      linkedin: 'arjun-mehta-mobile',
      github: 'arjun-dev',
      twitter: 'arjun_mobile',
    },
  },
]

const expertiseIcons: Record<string, any> = {
  'React': FaCode,
  'UI/UX Design': FaPalette,
  'Machine Learning': FaChartLine,
  'Entrepreneurship': FaRocket,
  'DevOps': FaUsers,
}

export default function MentorMatrix() {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'match' | 'rating' | 'price'>('match')

  const expertiseCategories = ['all', 'Development', 'Design', 'Data Science', 'Business', 'Cloud']

  const filteredMentors = mentors
    .filter(m => filter === 'all' || m.expertise.some(e => e.toLowerCase().includes(filter.toLowerCase())))
    .sort((a, b) => {
      if (sortBy === 'match') return b.matchScore - a.matchScore
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'price') return a.price - b.price
      return 0
    })

  const availabilityColors = {
    available: 'bg-green-500',
    busy: 'bg-yellow-500',
    booked: 'bg-red-500',
  }

  const availabilityLabels = {
    available: 'Available Now',
    busy: 'Limited Slots',
    booked: 'Fully Booked',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-indigo-900/10 py-20">
      <div className="container-custom px-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2 rounded-full mb-4">
            <FaUserTie className="animate-bounce" />
            <span className="font-bold">MentorMatrix™ Network</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Find Your Perfect Mentor
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            AI-matched mentorship connecting you with industry experts
          </p>
        </motion.div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 text-center"
          >
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">250+</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Expert Mentors</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-4 text-center"
          >
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">5000+</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Sessions Completed</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-4 text-center"
          >
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">4.8★</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-4 text-center"
          >
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">&lt; 3h</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</p>
          </motion.div>
        </div>

        {/* Filters & Sort */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {expertiseCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filter === category
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="match">Best Match</option>
                <option value="rating">Highest Rated</option>
                <option value="price">Price (Low to High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mentors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredMentors.map((mentor, index) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedMentor(mentor)}
              className="group cursor-pointer glass-card p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              {/* Match Score Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  {mentor.matchScore}% Match
                </div>
                <div className={`w-3 h-3 rounded-full ${availabilityColors[mentor.availability]} animate-pulse`} />
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 text-5xl flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full">
                  {mentor.avatar}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{mentor.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{mentor.title}</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{mentor.company}</p>
                </div>
              </div>

              {/* Rating & Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <FaStar className="text-yellow-500" />
                  <span className="font-bold text-gray-900 dark:text-white">{mentor.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaVideo />
                  <span>{mentor.totalSessions} sessions</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaClock />
                  <span>{mentor.responseTime}</span>
                </div>
              </div>

              {/* Expertise Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {mentor.expertise.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {mentor.expertise.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs">
                    +{mentor.expertise.length - 3} more
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200/30 dark:border-white/[0.06]">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{mentor.price}
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400">/session</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:shadow-lg"
                >
                  Book Now
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mentor Detail Modal */}
        <AnimatePresence>
          {selectedMentor && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setSelectedMentor(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedMentor(null)}
                  className="float-right text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>

                {/* Header */}
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-24 h-24 text-7xl flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl">
                    {selectedMentor.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                          {selectedMentor.name}
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">{selectedMentor.title}</p>
                        <p className="text-indigo-600 dark:text-indigo-400 font-semibold">{selectedMentor.company}</p>
                      </div>
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                        {selectedMentor.matchScore}% Match
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-3 mt-3">
                      {selectedMentor.social.linkedin && (
                        <a href={`https://linkedin.com/in/${selectedMentor.social.linkedin}`} target="_blank" className="text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform">
                          <FaLinkedin size={24} />
                        </a>
                      )}
                      {selectedMentor.social.github && (
                        <a href={`https://github.com/${selectedMentor.social.github}`} target="_blank" className="text-gray-800 dark:text-gray-200 hover:scale-110 transition-transform">
                          <FaGithub size={24} />
                        </a>
                      )}
                      {selectedMentor.social.twitter && (
                        <a href={`https://twitter.com/${selectedMentor.social.twitter}`} target="_blank" className="text-blue-400 dark:text-blue-300 hover:scale-110 transition-transform">
                          <FaTwitter size={24} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-1 text-yellow-600 dark:text-yellow-400 mb-1">
                      <FaStar />
                      <span className="text-2xl font-bold">{selectedMentor.rating}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">{selectedMentor.totalSessions}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Sessions</p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">{selectedMentor.responseTime}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Response</p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-center">
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${availabilityColors[selectedMentor.availability]}`}>
                      {availabilityLabels[selectedMentor.availability]}
                    </div>
                  </div>
                </div>

                {/* About */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">About</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{selectedMentor.about}</p>
                </div>

                {/* Expertise */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMentor.expertise.map((skill) => (
                      <span
                        key={skill}
                        className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Languages</h3>
                  <div className="flex gap-2">
                    {selectedMentor.languages.map((lang) => (
                      <span key={lang} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:shadow-xl"
                  >
                    <FaCalendar /> Book Session - ₹{selectedMentor.price}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg"
                  >
                    <FaHeart />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
