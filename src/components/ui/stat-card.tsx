import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  change?: number
  icon: LucideIcon
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  subtitle?: string
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
}

export default function StatCard({ title, value, change, icon: Icon, color, subtitle }: StatCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      return val.toLocaleString()
    }
    return val
  }

  const isPositiveChange = change !== undefined && change > 0
  const isNegativeChange = change !== undefined && change < 0

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </h3>
          </div>
          
          <div className="mt-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatValue(value)}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {change !== undefined && (
            <div className="mt-2 flex items-center space-x-1">
              {isPositiveChange && (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">
                    +{change.toFixed(1)}%
                  </span>
                </>
              )}
              {isNegativeChange && (
                <>
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-500">
                    {change.toFixed(1)}%
                  </span>
                </>
              )}
              {change === 0 && (
                <span className="text-sm font-medium text-gray-500">
                  No change
                </span>
              )}
              <span className="text-xs text-gray-400">vs last week</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}