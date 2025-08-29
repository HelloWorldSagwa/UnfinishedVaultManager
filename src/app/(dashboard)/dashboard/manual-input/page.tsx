'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User, Plus, FileText, MessageSquare, Check, X } from 'lucide-react'

interface Work {
  id: string
  title: string
  author: string
  category: string
}

interface User {
  id: string
  nickname: string
  email?: string
  status: string
}

export default function ManualInputPage() {
  // Form states
  const [activeTab, setActiveTab] = useState<'user' | 'work' | 'contribution'>('user')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Available users for dropdown
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  
  // User form state
  const [userForm, setUserForm] = useState({
    nickname: '',
    email: '',
    appleId: ''
  })
  
  // Work form state
  const [workForm, setWorkForm] = useState({
    title: '',
    content: '',
    author: '',
    authorId: '',
    category: '시',
    maxContributions: 4,
    isPrivate: false
  })
  
  // Contribution form state
  const [contributionForm, setContributionForm] = useState({
    workId: '',
    content: '',
    author: '',
    authorId: ''
  })
  
  // Works list for contribution selection
  const [works, setWorks] = useState<Work[]>([])
  
  useEffect(() => {
    loadUsers()
    if (activeTab === 'contribution') {
      loadWorks()
    }
  }, [activeTab])
  
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, email, status')
        .eq('status', 'active')
        .order('nickname', { ascending: true })
      
      if (error) throw error
      setAvailableUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }
  
  const loadWorks = async () => {
    try {
      const { data, error } = await supabase
        .from('works')
        .select('id, title, author, category')
        .order('created_date', { ascending: false })
      
      if (error) throw error
      setWorks(data || [])
    } catch (error) {
      console.error('Error loading works:', error)
    }
  }
  
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }
  
  const handleCreateUser = async () => {
    if (!userForm.nickname) {
      showMessage('error', 'Nickname is required')
      return
    }
    
    setLoading(true)
    try {
      // Generate a random UUID for the user
      const userId = crypto.randomUUID()
      
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          nickname: userForm.nickname,
          email: userForm.email || null,
          apple_id: userForm.appleId || null,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
      
      showMessage('success', `User "${userForm.nickname}" created successfully with ID: ${userId}`)
      setUserForm({ nickname: '', email: '', appleId: '' })
    } catch (error: any) {
      console.error('Error creating user:', error)
      showMessage('error', error.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCreateWork = async () => {
    if (!workForm.title || !workForm.content || !workForm.authorId) {
      showMessage('error', 'Title, content, and author are required')
      return
    }
    
    const selectedUser = availableUsers.find(u => u.id === workForm.authorId)
    if (!selectedUser) {
      showMessage('error', 'Please select a valid author')
      return
    }
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('works')
        .insert({
          title: workForm.title,
          content: workForm.content,
          author: selectedUser.nickname,
          author_id: selectedUser.id,
          category: workForm.category,
          max_contributions: workForm.maxContributions,
          is_private: workForm.isPrivate,
          completion_rate: 0.2, // Initial completion rate
          contributors_count: 0,
          view_count: 0,
          like_count: 0,
          created_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
      
      showMessage('success', `Work "${workForm.title}" created successfully`)
      setWorkForm({
        title: '',
        content: '',
        author: '',
        authorId: '',
        category: '시',
        maxContributions: 4,
        isPrivate: false
      })
    } catch (error: any) {
      console.error('Error creating work:', error)
      showMessage('error', error.message || 'Failed to create work')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCreateContribution = async () => {
    if (!contributionForm.workId || !contributionForm.content || !contributionForm.authorId) {
      showMessage('error', 'All fields are required')
      return
    }
    
    const selectedUser = availableUsers.find(u => u.id === contributionForm.authorId)
    if (!selectedUser) {
      showMessage('error', 'Please select a valid contributor')
      return
    }
    
    setLoading(true)
    try {
      // First, get the current work to update its statistics
      const { data: work, error: workError } = await supabase
        .from('works')
        .select('contributors_count, max_contributions, completion_rate')
        .eq('id', contributionForm.workId)
        .single()
      
      if (workError) throw workError
      
      // Create the contribution
      const { error: contribError } = await supabase
        .from('contributions')
        .insert({
          work_id: contributionForm.workId,
          content: contributionForm.content,
          author: selectedUser.nickname,
          author_id: selectedUser.id,
          timestamp: new Date().toISOString(),
          like_count: 0
        })
      
      if (contribError) throw contribError
      
      // Update work statistics
      const newContributorsCount = (work.contributors_count || 0) + 1
      const newCompletionRate = Math.min(
        1,
        0.2 + (newContributorsCount / work.max_contributions) * 0.8
      )
      
      const { error: updateError } = await supabase
        .from('works')
        .update({
          contributors_count: newContributorsCount,
          completion_rate: newCompletionRate,
          updated_at: new Date().toISOString()
        })
        .eq('id', contributionForm.workId)
      
      if (updateError) throw updateError
      
      const selectedWork = works.find(w => w.id === contributionForm.workId)
      showMessage('success', `Contribution added to "${selectedWork?.title || 'work'}"`)
      setContributionForm({ workId: '', content: '', author: '', authorId: '' })
      
      // Reload works to update the list
      loadWorks()
    } catch (error: any) {
      console.error('Error creating contribution:', error)
      showMessage('error', error.message || 'Failed to create contribution')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manual Data Input</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manually create users, works, and contributions
        </p>
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
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('user')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'user'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Create User</span>
        </button>
        <button
          onClick={() => setActiveTab('work')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'work'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Create Work</span>
        </button>
        <button
          onClick={() => setActiveTab('contribution')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'contribution'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Add Contribution</span>
        </button>
      </div>
      
      {/* Forms */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {/* User Creation Form */}
        {activeTab === 'user' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create New User
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nickname <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={userForm.nickname}
                onChange={(e) => setUserForm({ ...userForm, nickname: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter user nickname"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Apple ID (Optional)
              </label>
              <input
                type="text"
                value={userForm.appleId}
                onChange={(e) => setUserForm({ ...userForm, appleId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Apple ID"
              />
            </div>
            <button
              onClick={handleCreateUser}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create User</span>
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Work Creation Form */}
        {activeTab === 'work' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create New Work
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={workForm.title}
                onChange={(e) => setWorkForm({ ...workForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter work title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Author <span className="text-red-500">*</span>
              </label>
              <select
                value={workForm.authorId}
                onChange={(e) => {
                  const user = availableUsers.find(u => u.id === e.target.value)
                  setWorkForm({ ...workForm, authorId: e.target.value, author: user?.nickname || '' })
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select an author...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nickname} {user.email?.includes('@example.com') ? '(Dummy)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={workForm.content}
                onChange={(e) => setWorkForm({ ...workForm, content: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter work content"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={workForm.category}
                  onChange={(e) => setWorkForm({ ...workForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="시">시</option>
                  <option value="소설">소설</option>
                  <option value="에세이">에세이</option>
                  <option value="글">글</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Contributions
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={workForm.maxContributions}
                  onChange={(e) => setWorkForm({ ...workForm, maxContributions: parseInt(e.target.value) || 4 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={workForm.isPrivate}
                onChange={(e) => setWorkForm({ ...workForm, isPrivate: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPrivate" className="text-sm text-gray-700 dark:text-gray-300">
                Make this work private
              </label>
            </div>
            <button
              onClick={handleCreateWork}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Work</span>
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Contribution Form */}
        {activeTab === 'contribution' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Add Contribution to Existing Work
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Work <span className="text-red-500">*</span>
              </label>
              <select
                value={contributionForm.workId}
                onChange={(e) => setContributionForm({ ...contributionForm, workId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a work...</option>
                {works.map((work) => (
                  <option key={work.id} value={work.id}>
                    {work.title} - by {work.author} ({work.category})
                  </option>
                ))}
              </select>
              {contributionForm.workId && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Work ID: {contributionForm.workId}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contributor <span className="text-red-500">*</span>
              </label>
              <select
                value={contributionForm.authorId}
                onChange={(e) => {
                  const user = availableUsers.find(u => u.id === e.target.value)
                  setContributionForm({ ...contributionForm, authorId: e.target.value, author: user?.nickname || '' })
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a contributor...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nickname} {user.email?.includes('@example.com') ? '(Dummy)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contribution Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={contributionForm.content}
                onChange={(e) => setContributionForm({ ...contributionForm, content: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter contribution content"
              />
            </div>
            <button
              onClick={handleCreateContribution}
              disabled={loading || !works.length}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Contribution</span>
                </>
              )}
            </button>
            {!works.length && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
                No works available. Please create a work first.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}