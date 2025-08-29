'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import StatCard from '@/components/ui/stat-card'
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Heart, 
  TrendingUp,
  Calendar
} from 'lucide-react'
import { DashboardStats, ChartDataPoint, CategoryStats } from '@/types/database'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { format, subDays } from 'date-fns'

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6']

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load basic stats
      const [
        { count: totalUsers },
        { count: totalWorks },
        { count: totalContributions },
        { count: totalLikes },
        { count: activeUsers }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('works').select('*', { count: 'exact', head: true }),
        supabase.from('contributions').select('*', { count: 'exact', head: true }),
        supabase.from('likes').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ])

      // Calculate weekly growth (simplified - comparing last 7 days to previous 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

      const [
        { count: newUsersThisWeek },
        { count: newUsersLastWeek },
        { count: newWorksThisWeek },
        { count: newWorksLastWeek },
        { count: newContributionsThisWeek },
        { count: newContributionsLastWeek }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', twoWeeksAgo).lt('created_at', weekAgo),
        supabase.from('works').select('*', { count: 'exact', head: true }).gte('created_date', weekAgo),
        supabase.from('works').select('*', { count: 'exact', head: true }).gte('created_date', twoWeeksAgo).lt('created_date', weekAgo),
        supabase.from('contributions').select('*', { count: 'exact', head: true }).gte('timestamp', weekAgo),
        supabase.from('contributions').select('*', { count: 'exact', head: true }).gte('timestamp', twoWeeksAgo).lt('timestamp', weekAgo)
      ])

      const weeklyGrowth = {
        users: newUsersLastWeek ? ((newUsersThisWeek! - newUsersLastWeek!) / newUsersLastWeek!) * 100 : 100,
        works: newWorksLastWeek ? ((newWorksThisWeek! - newWorksLastWeek!) / newWorksLastWeek!) * 100 : 100,
        contributions: newContributionsLastWeek ? ((newContributionsThisWeek! - newContributionsLastWeek!) / newContributionsLastWeek!) * 100 : 100
      }

      setStats({
        totalUsers: totalUsers || 0,
        totalWorks: totalWorks || 0,
        totalContributions: totalContributions || 0,
        totalLikes: totalLikes || 0,
        activeUsers: activeUsers || 0,
        weeklyGrowth
      })

      // Load chart data for the last 7 days
      const chartDataPromises = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), i)
        const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString()
        const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString()
        
        return Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true })
            .gte('created_at', dayStart).lte('created_at', dayEnd),
          supabase.from('works').select('*', { count: 'exact', head: true })
            .gte('created_date', dayStart).lte('created_date', dayEnd),
          supabase.from('contributions').select('*', { count: 'exact', head: true })
            .gte('timestamp', dayStart).lte('timestamp', dayEnd)
        ]).then(([users, works, contributions]) => ({
          date: format(date, 'MMM dd'),
          users: users.count || 0,
          works: works.count || 0,
          contributions: contributions.count || 0
        }))
      })

      const chartResults = await Promise.all(chartDataPromises)
      setChartData(chartResults.reverse())

      // Load category statistics
      const { data: categories } = await supabase
        .from('works')
        .select('category')
        .neq('category', null)

      if (categories) {
        const categoryCount = categories.reduce((acc: Record<string, number>, work: any) => {
          const category = work.category
          acc[category] = (acc[category] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const totalCategoryWorks = Object.values(categoryCount).reduce((a, b) => Number(a) + Number(b), 0) as number
        const categoryStatsData = Object.entries(categoryCount).map(([category, count]) => ({
          category,
          count: count as number,
          percentage: totalCategoryWorks > 0 ? ((count as number) / totalCategoryWorks) * 100 : 0
        }))

        setCategoryStats(categoryStatsData.sort((a, b) => b.count - a.count))
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome to the UnfinishedVault admin dashboard
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}</span>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            change={stats.weeklyGrowth.users}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Total Works"
            value={stats.totalWorks}
            change={stats.weeklyGrowth.works}
            icon={FileText}
            color="green"
          />
          <StatCard
            title="Total Contributions"
            value={stats.totalContributions}
            change={stats.weeklyGrowth.contributions}
            icon={MessageSquare}
            color="purple"
          />
          <StatCard
            title="Total Likes"
            value={stats.totalLikes}
            icon={Heart}
            color="red"
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon={TrendingUp}
            color="yellow"
            subtitle="Last 7 days"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Daily Activity (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" className="text-sm" />
              <YAxis className="text-sm" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} name="Users" />
              <Line type="monotone" dataKey="works" stroke="#10B981" strokeWidth={2} name="Works" />
              <Line type="monotone" dataKey="contributions" stroke="#8B5CF6" strokeWidth={2} name="Contributions" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Works by Category
          </h3>
          {categoryStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryStats}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                >
                  {categoryStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              No category data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}