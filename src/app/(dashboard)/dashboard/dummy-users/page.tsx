'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { UserPlus, Trash2, Users, Check, X } from 'lucide-react'

interface DummyUser {
  id: string
  nickname: string
  email?: string
  apple_id?: string
  status: string
  created_at: string
}

export default function DummyUsersPage() {
  const [users, setUsers] = useState<DummyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [newUser, setNewUser] = useState({
    nickname: '',
    email: '',
    appleId: ''
  })
  
  useEffect(() => {
    loadDummyUsers()
  }, [])
  
  const loadDummyUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .like('email', '%@example.com')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading dummy users:', error)
      showMessage('error', 'Failed to load dummy users')
    } finally {
      setLoading(false)
    }
  }
  
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }
  
  const createDummyUser = async () => {
    if (!newUser.nickname) {
      showMessage('error', 'Nickname is required')
      return
    }
    
    setCreating(true)
    try {
      // Generate unique email with timestamp to avoid duplicates
      const timestamp = Date.now()
      const dummyEmail = newUser.email || `${newUser.nickname.toLowerCase().replace(/\s+/g, '')}_${timestamp}@example.com`
      
      // First, create a user in auth.users using Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dummyEmail,
        password: `DummyPass${timestamp}!`, // Generate a secure dummy password
        options: {
          data: {
            nickname: newUser.nickname
          }
        }
      })
      
      if (authError) throw authError
      
      if (!authData.user) {
        throw new Error('Failed to create auth user')
      }
      
      // Then create/update the profile with the same ID
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          nickname: newUser.nickname,
          email: dummyEmail,
          apple_id: newUser.appleId || null,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (profileError) throw profileError
      
      showMessage('success', `Dummy user "${newUser.nickname}" created successfully`)
      setNewUser({ nickname: '', email: '', appleId: '' })
      loadDummyUsers()
    } catch (error: any) {
      console.error('Error creating dummy user:', error)
      // Handle duplicate email error specifically
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('already registered')) {
        showMessage('error', 'A user with this email already exists. Please use a different email.')
      } else if (error.code === '23503') {
        showMessage('error', 'Failed to create user profile. Please try again.')
      } else {
        showMessage('error', error.message || 'Failed to create dummy user')
      }
    } finally {
      setCreating(false)
    }
  }
  
  
  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this dummy user?')) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
      
      if (error) throw error
      
      setUsers(users.filter(u => u.id !== userId))
      showMessage('success', 'Dummy user deleted successfully')
    } catch (error: any) {
      console.error('Error deleting user:', error)
      showMessage('error', error.message || 'Failed to delete user')
    }
  }
  
  const deleteAllDummyUsers = async () => {
    if (!confirm('Are you sure you want to delete ALL dummy users? This action cannot be undone.')) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .like('email', '%@example.com')
      
      if (error) throw error
      
      setUsers([])
      showMessage('success', 'All dummy users deleted successfully')
    } catch (error: any) {
      console.error('Error deleting all dummy users:', error)
      showMessage('error', error.message || 'Failed to delete dummy users')
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dummy Users Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage dummy users for testing
          </p>
        </div>
        {users.length > 0 && (
          <button
            onClick={deleteAllDummyUsers}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete All</span>
          </button>
        )}
      </div>
      
      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-3 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {message.type === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <X className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
      
      {/* Create New Dummy User */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Create New Dummy User
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              value={newUser.nickname}
              onChange={(e) => setNewUser({ ...newUser, nickname: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nickname *"
            />
          </div>
          <div>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Email (optional)"
            />
          </div>
          <div>
            <input
              type="text"
              value={newUser.appleId}
              onChange={(e) => setNewUser({ ...newUser, appleId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Apple ID (optional)"
            />
          </div>
          <div>
            <button
              onClick={createDummyUser}
              disabled={creating || !newUser.nickname}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {creating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create User</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Dummy Users List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Dummy Users ({users.length})
            </h2>
            <Users className="w-5 h-5 text-gray-500" />
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No dummy users created yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Create a user or generate random users to get started
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nickname
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.nickname}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                        {user.id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}