'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import DataTable, { Column } from '@/components/ui/data-table'
import { Work, Profile } from '@/types/database'
import { Eye, Edit, Trash2, Plus, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

type WorkWithProfile = Work & {
  profiles?: Profile | null
}

export default function WorksManagementPage() {
  const [works, setWorks] = useState<WorkWithProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorks()
  }, [])

  const loadWorks = async () => {
    try {
      const { data, error } = await supabase
        .from('works')
        .select(`
          *,
          profiles:author_id (
            id,
            nickname,
            status
          )
        `)
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

  const columns: Column<WorkWithProfile>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (value, work) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white truncate max-w-xs" title={value}>
            {value}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {work.category}
          </div>
        </div>
      )
    },
    {
      key: 'author',
      header: 'Author',
      sortable: true,
      render: (value, work) => (
        <div>
          <div className="text-gray-900 dark:text-white">
            {work.profiles?.nickname || value || 'Anonymous'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {work.profiles?.status && (
              <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                work.profiles.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {work.profiles.status}
              </span>
            )}
          </div>
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
      render: (value) => (
        <span className="text-gray-900 dark:text-white">{value || 0}</span>
      )
    },
    {
      key: 'view_count',
      header: 'Views',
      sortable: true,
      render: (value) => (
        <span className="text-gray-900 dark:text-white">{value || 0}</span>
      )
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
      header: 'Actions',
      render: (value, work) => (
        <div className="flex items-center space-x-2">
          <button
            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            className="p-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(work.id)}
            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
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
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Work</span>
        </button>
      </div>

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