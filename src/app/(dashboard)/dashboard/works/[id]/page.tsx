'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, User, Calendar, Eye, Heart, MessageSquare, Plus, Trash2, Edit } from 'lucide-react'
import { format } from 'date-fns'

interface Work {
  id: string
  title: string
  content: string
  author: string
  author_id?: string
  category: string
  completion_rate: number
  contributors_count: number
  created_date: string
  view_count: number
  like_count: number
  is_private: boolean
  max_contributions: number
}

interface Contribution {
  id: string
  work_id: string
  author: string
  author_id?: string
  content: string
  timestamp: string
  like_count: number
}

interface User {
  id: string
  nickname: string
  email?: string
  status: string
}

export default function WorkDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workId = params.id as string
  
  const [work, setWork] = useState<Work | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [showContributionForm, setShowContributionForm] = useState(false)
  const [contributionForm, setContributionForm] = useState({
    author: '',
    authorId: '',
    content: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  
  useEffect(() => {
    loadUsers()
    if (workId) {
      loadWorkDetails()
    }
  }, [workId])
  
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, email, status')
        .eq('status', 'active')
        .like('email', '%@example.com')  // Only load dummy users
        .order('nickname', { ascending: true })
      
      if (error) throw error
      setAvailableUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }
  
  const loadWorkDetails = async () => {
    try {
      // Load work details
      const { data: workData, error: workError } = await supabase
        .from('works')
        .select('*')
        .eq('id', workId)
        .single()
      
      if (workError) throw workError
      setWork(workData)
      
      // Load contributions
      const { data: contribData, error: contribError } = await supabase
        .from('contributions')
        .select('*')
        .eq('work_id', workId)
        .order('timestamp', { ascending: false })
      
      if (contribError) throw contribError
      setContributions(contribData || [])
    } catch (error) {
      console.error('Error loading work details:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleAddContribution = async () => {
    if (!contributionForm.authorId || !contributionForm.content) {
      alert('Please select a contributor and enter content')
      return
    }
    
    const selectedUser = availableUsers.find(u => u.id === contributionForm.authorId)
    if (!selectedUser) {
      alert('Please select a valid contributor')
      return
    }
    
    if (!work) return
    
    setSubmitting(true)
    try {
      // Create contribution
      const { data: newContribution, error: contribError } = await supabase
        .from('contributions')
        .insert({
          work_id: workId,
          author: selectedUser.nickname,
          author_id: selectedUser.id,
          content: contributionForm.content,
          timestamp: new Date().toISOString(),
          like_count: 0
        })
        .select()
        .single()
      
      if (contribError) throw contribError
      
      // Update work statistics
      const newContributorsCount = work.contributors_count + 1
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
        .eq('id', workId)
      
      if (updateError) throw updateError
      
      // Update local state
      setWork({
        ...work,
        contributors_count: newContributorsCount,
        completion_rate: newCompletionRate
      })
      setContributions([newContribution, ...contributions])
      setContributionForm({ author: '', authorId: '', content: '' })
      setShowContributionForm(false)
    } catch (error: any) {
      console.error('Error adding contribution:', error)
      alert(error.message || 'Failed to add contribution')
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleDeleteContribution = async (contributionId: string) => {
    if (!confirm('Are you sure you want to delete this contribution?')) {
      return
    }
    
    if (!work) return
    
    try {
      const { error } = await supabase
        .from('contributions')
        .delete()
        .eq('id', contributionId)
      
      if (error) throw error
      
      // Update work statistics
      const newContributorsCount = Math.max(0, work.contributors_count - 1)
      const newCompletionRate = Math.max(
        0.2,
        0.2 + (newContributorsCount / work.max_contributions) * 0.8
      )
      
      await supabase
        .from('works')
        .update({
          contributors_count: newContributorsCount,
          completion_rate: newCompletionRate,
          updated_at: new Date().toISOString()
        })
        .eq('id', workId)
      
      // Update local state
      setWork({
        ...work,
        contributors_count: newContributorsCount,
        completion_rate: newCompletionRate
      })
      setContributions(contributions.filter(c => c.id !== contributionId))
    } catch (error) {
      console.error('Error deleting contribution:', error)
      alert('Failed to delete contribution')
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!work) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Work not found</p>
        <button
          onClick={() => router.push('/dashboard/works')}
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Works
        </button>
      </div>
    )
  }
  
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.push('/dashboard/works')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Work Details</h1>
      </div>
      
      {/* Work Information Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          {/* Title and Category */}
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {work.title}
                </h2>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="inline-flex px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-sm">
                    {work.category}
                  </span>
                  {work.is_private && (
                    <span className="inline-flex px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md text-sm">
                      Private
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Author and Date */}
          <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>{work.author}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(work.created_date), 'MMM dd, yyyy')}</span>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(work.completion_rate * 100)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completion</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {work.contributors_count}/{work.max_contributions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Contributors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {work.like_count}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Likes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {work.view_count}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Views</div>
            </div>
          </div>
          
          {/* Content */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Original Content</h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {work.content}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contributions Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Contributions ({contributions.length})
          </h3>
          {work.contributors_count < work.max_contributions && (
            <button
              onClick={() => setShowContributionForm(!showContributionForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Contribution</span>
            </button>
          )}
        </div>
        
        {/* Contribution Form */}
        {showContributionForm && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-4">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a dummy user...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nickname}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Contribution <span className="text-red-500">*</span>
              </label>
              <textarea
                value={contributionForm.content}
                onChange={(e) => setContributionForm({ ...contributionForm, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Continue the story..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAddContribution}
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Contribution'}
              </button>
              <button
                onClick={() => {
                  setShowContributionForm(false)
                  setContributionForm({ author: '', authorId: '', content: '' })
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Contributions List */}
        {contributions.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No contributions yet</p>
            {work.contributors_count < work.max_contributions && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Be the first to contribute!
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {contributions.map((contribution) => (
              <div
                key={contribution.id}
                className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {contribution.author}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(contribution.timestamp), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{contribution.like_count}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteContribution(contribution.id)}
                    className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete Contribution"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {contribution.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}