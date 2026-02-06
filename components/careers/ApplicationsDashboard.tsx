'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaDownload, FaFilter, FaEye } from 'react-icons/fa'
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { getFirestore } from 'firebase/firestore'
import { useAuth } from '@/lib/AuthContext'

interface Application {
  id: string
  fullName: string
  email: string
  phone: string
  college: string
  yearOrExperience: string
  roleId: string
  roleTitle: string
  resumeURL: string
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected'
  submittedAt: any
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  reviewed: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  shortlisted: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

export default function ApplicationsDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [isEmployee, setIsEmployee] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [roles, setRoles] = useState<string[]>([])
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)

  // Check if user is an employee
  useEffect(() => {
    const checkEmployeeStatus = async () => {
      if (!user?.email) {
        router.push('/careers')
        return
      }

      try {
        const db = getFirestore()
        const employeesRef = collection(db, 'Employees')
        const q = query(employeesRef, where('email', '==', user.email))
        const querySnapshot = await getDocs(q)
        
        if (querySnapshot.empty) {
          toast.error('Unauthorized access - Employees only')
          router.push('/careers')
          return
        }
        
        setIsEmployee(true)
      } catch (error) {
        console.error('Error checking employee status:', error)
        router.push('/careers')
      }
    }

    checkEmployeeStatus()
  }, [user, router])

  useEffect(() => {
    if (isEmployee) {
      fetchApplications()
    }
  }, [isEmployee])

  const fetchApplications = async () => {
    try {
      const applicationsRef = collection(db, 'applications')
      const querySnapshot = await getDocs(applicationsRef)
      
      const fetchedApplications: Application[] = []
      const rolesSet = new Set<string>()
      
      querySnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() } as Application
        fetchedApplications.push(data)
        if (data.roleTitle) rolesSet.add(data.roleTitle)
      })
      
      fetchedApplications.sort((a, b) => b.submittedAt?.seconds - a.submittedAt?.seconds)
      setApplications(fetchedApplications)
      setFilteredApplications(fetchedApplications)
      setRoles(Array.from(rolesSet))
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = applications

    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.status === filterStatus)
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(app => app.roleTitle === filterRole)
    }

    setFilteredApplications(filtered)
  }, [filterStatus, filterRole, applications])

  const handleStatusChange = async (appId: string, newStatus: Application['status']) => {
    try {
      await updateDoc(doc(db, 'applications', appId), { status: newStatus })
      toast.success('Status updated successfully')
      fetchApplications()
      setSelectedApp(null)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const getStatusBadge = (status: Application['status']) => (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )

  if (!isEmployee) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-950">
      <div className="container-custom px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Applications Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all job applications
            </p>
          </div>

          {/* Filters */}
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-600 dark:text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-white">Filters:</span>
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>

              <div className="ml-auto text-gray-600 dark:text-gray-400">
                <span className="font-semibold">{filteredApplications.length}</span> applications
              </div>
            </div>
          </div>

          {/* Applications List */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-xl text-gray-600 dark:text-gray-400">
                No applications found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app, index) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {app.fullName}
                        </h3>
                        {getStatusBadge(app.status)}
                      </div>
                      
                      <p className="text-cyan-600 dark:text-cyan-400 font-semibold mb-2">
                        Applied for: {app.roleTitle}
                      </p>

                      <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <p><span className="font-semibold">Email:</span> {app.email}</p>
                        <p><span className="font-semibold">Phone:</span> {app.phone}</p>
                        <p><span className="font-semibold">College:</span> {app.college}</p>
                        <p><span className="font-semibold">Year/Experience:</span> {app.yearOrExperience}</p>
                      </div>

                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        Submitted: {app.submittedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <FaEye />
                        View Details
                      </button>
                      <a
                        href={app.resumeURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-center"
                      >
                        <FaDownload />
                        Resume
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Application Details
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Full Name</label>
                <p className="text-lg text-gray-900 dark:text-white">{selectedApp.fullName}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Applied For</label>
                <p className="text-lg text-cyan-600 dark:text-cyan-400 font-semibold">{selectedApp.roleTitle}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Email</label>
                  <p className="text-gray-900 dark:text-white">{selectedApp.email}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Phone</label>
                  <p className="text-gray-900 dark:text-white">{selectedApp.phone}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">College/Organization</label>
                <p className="text-gray-900 dark:text-white">{selectedApp.college}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Year/Experience</label>
                <p className="text-gray-900 dark:text-white">{selectedApp.yearOrExperience}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Current Status</label>
                <div className="mt-1">{getStatusBadge(selectedApp.status)}</div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Update Status
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['pending', 'reviewed', 'shortlisted', 'rejected'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(selectedApp.id, status)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      selectedApp.status === status
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <a
                href={selectedApp.resumeURL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all text-center"
              >
                View Resume
              </a>
              <button
                onClick={() => setSelectedApp(null)}
                className="px-8 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
