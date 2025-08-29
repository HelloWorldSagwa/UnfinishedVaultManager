'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import DataTable, { Column } from '@/components/ui/data-table'
import { Profile } from '@/types/database'
import { Shield, ShieldCheck, Ban, UserCheck, MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'

export default function UsersManagementPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (userId: string, newStatus: Profile['status']) => {
    if (!confirm(`Are you sure you want to change this user's status to ${newStatus}?`)) {
      return
    }

    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ))
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Failed to update user status')
    }
  }

  const handleRoleChange = async (userId: string, newRole: Profile['role']) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return
    }

    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Failed to update user role')
    }
  }

  const getStatusColor = (status: Profile['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'deleted':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      case 'suspended':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getRoleIcon = (role: Profile['role']) => {
    if (role === 'admin') {
      return <ShieldCheck className="w-4 h-4 text-purple-600" />
    }
    return <Shield className="w-4 h-4 text-gray-400" />
  }

  const columns: Column<Profile>[] = [
    {
      key: 'nickname',
      header: 'User',
      sortable: true,
      render: (value, user) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {(value || user.email || 'U')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {value || 'No nickname'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
              {user.email || 'No email'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'apple_id',
      header: 'Apple ID',
      render: (value) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
          {value ? `${value.substring(0, 8)}...` : 'N/A'}
        </span>
      )
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (value, user) => (
        <div className="flex items-center space-x-2">
          {getRoleIcon(value)}
          <select
            value={value || 'user'}
            onChange={(e) => handleRoleChange(user.id, e.target.value as Profile['role'])}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value, user) => (
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
            {value}
          </span>
          <select
            value={value}
            onChange={(e) => handleStatusChange(user.id, e.target.value as Profile['status'])}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Joined',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {format(new Date(value), 'MMM dd, yyyy')}
        </div>
      )
    },
    {
      key: 'updated_at',
      header: 'Last Activity',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {format(new Date(value), 'MMM dd, yyyy')}
        </div>
      )
    }
  ]

  const activeUsers = users.filter(user => user.status === 'active').length
  const suspendedUsers = users.filter(user => user.status === 'suspended').length
  const deletedUsers = users.filter(user => user.status === 'deleted').length
  const adminUsers = users.filter(user => user.role === 'admin').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {users.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {activeUsers}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {suspendedUsers}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Suspended</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {deletedUsers}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Deleted</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {adminUsers}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Admins</div>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search users by nickname, email, or Apple ID..."
        emptyState={
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-2">No users found</div>
            <div className="text-sm text-gray-400">Users will appear here once they sign up</div>
          </div>
        }
      />
    </div>
  )
}