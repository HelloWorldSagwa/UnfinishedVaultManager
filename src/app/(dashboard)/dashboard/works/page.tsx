'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import DataTable, { Column } from '@/components/ui/data-table'
import { Work } from '@/types/database'
import { Trash2, Plus } from 'lucide-react'
import { format } from 'date-fns'

export default function WorksManagementPage() {
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLikes, setEditingLikes] = useState<{ [key: string]: number | null }>({})
  const [editingViews, setEditingViews] = useState<{ [key: string]: number | null }>({})
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [bulkLikesValue, setBulkLikesValue] = useState(0)
  const [bulkViewsValue, setBulkViewsValue] = useState(0)

  useEffect(() => {
    loadWorks()
  }, [])

  const loadWorks = async () => {
    try {
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .order('created_date', { ascending: false })

      if (error) throw error
      setWorks(data || [])
    } catch (error) {
      console.error('Error loading works:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await (supabase as any)
        .from('works')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setWorks(works.filter(work => work.id !== id))
    } catch (error) {
      console.error('Error deleting work:', error)
      alert('Failed to delete work')
    }
  }

  const handleUpdateLikes = async (id: string, newValue: number) => {
    try {
      const { error } = await supabase
        .from('works')
        .update({ like_count: newValue })
        .eq('id', id)

      if (error) throw error
      
      setWorks(works.map(work => 
        work.id === id ? { ...work, like_count: newValue } : work
      ))
      setEditingLikes({ ...editingLikes, [id]: null })
    } catch (error) {
      console.error('Error updating likes:', error)
      alert('Failed to update likes')
    }
  }

  const handleUpdateViews = async (id: string, newValue: number) => {
    try {
      const { error } = await supabase
        .from('works')
        .update({ view_count: newValue })
        .eq('id', id)

      if (error) throw error
      
      setWorks(works.map(work => 
        work.id === id ? { ...work, view_count: newValue } : work
      ))
      setEditingViews({ ...editingViews, [id]: null })
    } catch (error) {
      console.error('Error updating views:', error)
      alert('Failed to update views')
    }
  }

  const handleBulkUpdateLikes = async () => {
    try {
      // Update all works in database
      for (const work of works) {
        await supabase
          .from('works')
          .update({ like_count: bulkLikesValue })
          .eq('id', work.id)
      }
      
      // Update local state
      setWorks(works.map(work => ({ ...work, like_count: bulkLikesValue })))
      setBulkEditMode(false)
      alert(`Successfully updated all likes to ${bulkLikesValue}`)
    } catch (error) {
      console.error('Error bulk updating likes:', error)
      alert('Failed to bulk update likes')
    }
  }

  const handleBulkUpdateViews = async () => {
    try {
      // Update all works in database
      for (const work of works) {
        await supabase
          .from('works')
          .update({ view_count: bulkViewsValue })
          .eq('id', work.id)
      }
      
      // Update local state
      setWorks(works.map(work => ({ ...work, view_count: bulkViewsValue })))
      setBulkEditMode(false)
      alert(`Successfully updated all views to ${bulkViewsValue}`)
    } catch (error) {
      console.error('Error bulk updating views:', error)
      alert('Failed to bulk update views')
    }
  }

  const handleTogglePrivate = async (id: string, currentPrivate: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('works')
        .update({ is_private: !currentPrivate })
        .eq('id', id)

      if (error) throw error
      
      setWorks(works.map(work => 
        work.id === id ? { ...work, is_private: !currentPrivate } : work
      ))
    } catch (error) {
      console.error('Error updating work visibility:', error)
      alert('Failed to update work visibility')
    }
  }

  const columns: Column<Work>[] = [
    {
      key: 'title',
      header: 'Title & Content',
      sortable: true,
      render: (value, work) => (
        <div className="max-w-md">
          <a 
            href={`/dashboard/works/${work.id}`}
            className="block hover:opacity-80 transition-opacity"
          >
            <div className="font-medium text-blue-600 dark:text-blue-400 hover:underline" title={value}>
              {value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {work.content.substring(0, 100)}{work.content.length > 100 ? '...' : ''}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              <span className="inline-flex px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                {work.category}
              </span>
            </div>
          </a>
        </div>
      )
    },
    {
      key: 'author',
      header: 'Author',
      sortable: true,
      render: (value, work) => (
        <div className="text-gray-900 dark:text-white">
          {value || 'Anonymous'}
        </div>
      )
    },
    {
      key: 'completion_rate',
      header: 'Progress',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${(value * 100)}%` }}
            ></div>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(value * 100)}%
          </span>
        </div>
      )
    },
    {
      key: 'like_count',
      header: 'Likes',
      sortable: true,
      render: (value, work) => {
        const isEditing = editingLikes[work.id] !== undefined && editingLikes[work.id] !== null
        
        if (isEditing) {
          return (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={editingLikes[work.id] || 0}
                onChange={(e) => setEditingLikes({ ...editingLikes, [work.id]: parseInt(e.target.value) || 0 })}
                className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
              />
              <button
                onClick={() => handleUpdateLikes(work.id, editingLikes[work.id] || 0)}
                className="px-2 py-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded text-sm font-bold"
              >
                ✓
              </button>
              <button
                onClick={() => setEditingLikes({ ...editingLikes, [work.id]: null })}
                className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-sm font-bold"
              >
                ✗
              </button>
            </div>
          )
        }
        
        return (
          <button
            onClick={() => setEditingLikes({ ...editingLikes, [work.id]: value || 0 })}
            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
          >
            {value || 0}
          </button>
        )
      }
    },
    {
      key: 'view_count',
      header: 'Views',
      sortable: true,
      render: (value, work) => {
        const isEditing = editingViews[work.id] !== undefined && editingViews[work.id] !== null
        
        if (isEditing) {
          return (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={editingViews[work.id] || 0}
                onChange={(e) => setEditingViews({ ...editingViews, [work.id]: parseInt(e.target.value) || 0 })}
                className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
              />
              <button
                onClick={() => handleUpdateViews(work.id, editingViews[work.id] || 0)}
                className="px-2 py-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded text-sm font-bold"
              >
                ✓
              </button>
              <button
                onClick={() => setEditingViews({ ...editingViews, [work.id]: null })}
                className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-sm font-bold"
              >
                ✗
              </button>
            </div>
          )
        }
        
        return (
          <button
            onClick={() => setEditingViews({ ...editingViews, [work.id]: value || 0 })}
            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
          >
            {value || 0}
          </button>
        )
      }
    },
    {
      key: 'contributors_count',
      header: 'Contributors',
      sortable: true,
      render: (value, work) => (
        <span className="text-gray-900 dark:text-white">
          {value || 0} / {work.max_contributions}
        </span>
      )
    },
    {
      key: 'created_date',
      header: 'Created',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {format(new Date(value), 'MMM dd, yyyy')}
        </span>
      )
    },
    {
      key: 'is_private',
      header: 'Visibility',
      render: (value, work) => (
        <button
          onClick={() => handleTogglePrivate(work.id, value)}
          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
            value 
              ? 'bg-red-100 text-red-800 hover:bg-red-200' 
              : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
        >
          {value ? 'Private' : 'Public'}
        </button>
      )
    },
    {
      key: 'id',
      header: 'Delete',
      render: (value, work) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => handleDelete(work.id)}
            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete Work"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Works Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all works in the UnfinishedVault platform
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setBulkEditMode(!bulkEditMode)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <span>{bulkEditMode ? 'Cancel Bulk Edit' : 'Bulk Edit Stats'}</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Work</span>
          </button>
        </div>
      </div>

      {/* Bulk Edit Panel */}
      {bulkEditMode && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-3">Bulk Edit Mode - Update All Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <label className="font-medium text-gray-700 dark:text-gray-300">Set All Likes to:</label>
              <input
                type="number"
                value={bulkLikesValue}
                onChange={(e) => setBulkLikesValue(parseInt(e.target.value) || 0)}
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
              />
              <button
                onClick={handleBulkUpdateLikes}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Apply to All
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <label className="font-medium text-gray-700 dark:text-gray-300">Set All Views to:</label>
              <input
                type="number"
                value={bulkViewsValue}
                onChange={(e) => setBulkViewsValue(parseInt(e.target.value) || 0)}
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
              />
              <button
                onClick={handleBulkUpdateViews}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Apply to All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {works.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Works</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {works.filter(w => !w.is_private).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Public Works</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {works.filter(w => w.completion_rate >= 1).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed Works</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(works.reduce((sum, w) => sum + (w.completion_rate || 0), 0) / works.length * 100) || 0}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Completion</div>
        </div>
      </div>

      {/* Works Table */}
      <DataTable
        data={works}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search works by title, author, or category..."
        emptyState={
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-2">No works found</div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Create your first work
            </button>
          </div>
        }
      />
    </div>
  )
}