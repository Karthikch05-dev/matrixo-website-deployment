'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaPlus, FaEdit, FaTrash, FaLock, FaUnlock } from 'react-icons/fa'
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, Timestamp, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { getFirestore } from 'firebase/firestore'
import { useAuth } from '@/lib/AuthContext'

interface Role {
  id: string
  title: string
  description: string
  team: string
  location: string
  type: string
  status: 'open' | 'closed'
  createdAt: any
  createdBy?: string
  responsibilities?: string[]
  eligibility?: string[]
}

export default function RoleManagement() {
  const router = useRouter()
  const { user } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [isEmployee, setIsEmployee] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    team: '',
    location: 'Remote',
    type: 'Full-time',
    responsibilities: '',
    eligibility: '',
  })

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
      fetchRoles()
    }
  }, [isEmployee])

  const fetchRoles = async () => {
    try {
      const rolesRef = collection(db, 'roles')
      const querySnapshot = await getDocs(rolesRef)
      
      const fetchedRoles: Role[] = []
      querySnapshot.forEach((doc) => {
        fetchedRoles.push({ id: doc.id, ...doc.data() } as Role)
      })
      
      fetchedRoles.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
      setRoles(fetchedRoles)
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast.error('Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description || !formData.team) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const roleData = {
        title: formData.title,
        description: formData.description,
        team: formData.team,
        location: formData.location,
        type: formData.type,
        responsibilities: formData.responsibilities.split('\n').filter(r => r.trim()),
        eligibility: formData.eligibility.split('\n').filter(e => e.trim()),
        status: 'open' as const,
        createdAt: Timestamp.now(),
        createdBy: user?.email || 'Unknown',
      }

      if (editingRole) {
        await updateDoc(doc(db, 'roles', editingRole.id), roleData)
        toast.success('Role updated successfully')
      } else {
        await addDoc(collection(db, 'roles'), roleData)
        toast.success('Role created successfully')
      }

      setShowForm(false)
      setEditingRole(null)
      setFormData({
        title: '',
        description: '',
        team: '',
        location: 'Remote',
        type: 'Full-time',
        responsibilities: '',
        eligibility: '',
      })
      fetchRoles()
    } catch (error) {
      console.error('Error saving role:', error)
      toast.error('Failed to save role')
    }
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({
      title: role.title,
      description: role.description,
      team: role.team,
      location: role.location,
      type: role.type,
      responsibilities: role.responsibilities?.join('\n') || '',
      eligibility: role.eligibility?.join('\n') || '',
    })
    setShowForm(true)
  }

  const handleToggleStatus = async (role: Role) => {
    try {
      const newStatus = role.status === 'open' ? 'closed' : 'open'
      await updateDoc(doc(db, 'roles', role.id), { status: newStatus })
      toast.success(`Role ${newStatus === 'open' ? 'opened' : 'closed'} successfully`)
      fetchRoles()
    } catch (error) {
      console.error('Error updating role status:', error)
      toast.error('Failed to update role status')
    }
  }

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return

    try {
      await deleteDoc(doc(db, 'roles', roleId))
      toast.success('Role deleted successfully')
      fetchRoles()
    } catch (error) {
      console.error('Error deleting role:', error)
      toast.error('Failed to delete role')
    }
  }

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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Role Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create and manage career opportunities
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(true)
                setEditingRole(null)
                setFormData({
                  title: '',
                  description: '',
                  team: '',
                  location: 'Remote',
                  type: 'Full-time',
                  responsibilities: '',
                  eligibility: '',
                })
              }}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center"
            >
              <FaPlus className="mr-2" />
              Create New Role
            </button>
          </div>

          {/* Form Modal */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Role Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="e.g., Full Stack Developer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Team / Department *
                    </label>
                    <input
                      type="text"
                      name="team"
                      value={formData.team}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="e.g., Engineering"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Brief description of the role"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Responsibilities (one per line)
                  </label>
                  <textarea
                    name="responsibilities"
                    value={formData.responsibilities}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Develop features&#10;Write tests&#10;Code reviews"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Eligibility / Requirements (one per line)
                  </label>
                  <textarea
                    name="eligibility"
                    value={formData.eligibility}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="2+ years experience&#10;Knowledge of React&#10;Good communication"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    {editingRole ? 'Update Role' : 'Create Role'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingRole(null)
                    }}
                    className="px-8 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Roles List */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {roles.map((role, index) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {role.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            role.status === 'open'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {role.status === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      <p className="text-cyan-600 dark:text-cyan-400 mb-2">
                        {role.team} • {role.location} • {role.type}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {role.description}
                      </p>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(role)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(role)}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                        title={role.status === 'open' ? 'Close' : 'Open'}
                      >
                        {role.status === 'open' ? <FaLock size={18} /> : <FaUnlock size={18} />}
                      </button>
                      <button
                        onClick={() => handleDelete(role.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
