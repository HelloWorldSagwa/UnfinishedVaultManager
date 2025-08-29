export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nickname: string | null
          apple_id: string | null
          status: 'active' | 'deleted' | 'inactive' | 'pending' | 'suspended'
          created_at: string
          updated_at: string
          email: string | null
          role: 'user' | 'admin' | null
          is_dummy: boolean
        }
        Insert: {
          id: string
          nickname?: string | null
          apple_id?: string | null
          status?: 'active' | 'deleted' | 'inactive' | 'pending' | 'suspended'
          created_at?: string
          updated_at?: string
          email?: string | null
          role?: 'user' | 'admin' | null
          is_dummy?: boolean
        }
        Update: {
          id?: string
          nickname?: string | null
          apple_id?: string | null
          status?: 'active' | 'deleted' | 'inactive' | 'pending' | 'suspended'
          created_at?: string
          updated_at?: string
          email?: string | null
          role?: 'user' | 'admin' | null
          is_dummy?: boolean
        }
      }
      works: {
        Row: {
          id: string
          title: string
          content: string
          author: string
          author_id: string | null
          category: string
          completion_rate: number
          contributors_count: number
          created_date: string
          view_count: number
          like_count: number
          is_private: boolean
          updated_at: string
          max_contributions: number
        }
        Insert: {
          id?: string
          title: string
          content: string
          author?: string
          author_id?: string | null
          category?: string
          completion_rate?: number
          contributors_count?: number
          created_date?: string
          view_count?: number
          like_count?: number
          is_private?: boolean
          updated_at?: string
          max_contributions?: number
        }
        Update: {
          id?: string
          title?: string
          content?: string
          author?: string
          author_id?: string | null
          category?: string
          completion_rate?: number
          contributors_count?: number
          created_date?: string
          view_count?: number
          like_count?: number
          is_private?: boolean
          updated_at?: string
          max_contributions?: number
        }
      }
      contributions: {
        Row: {
          id: string
          work_id: string | null
          author: string
          author_id: string | null
          content: string
          timestamp: string
          like_count: number
        }
        Insert: {
          id?: string
          work_id?: string | null
          author?: string
          author_id?: string | null
          content: string
          timestamp?: string
          like_count?: number
        }
        Update: {
          id?: string
          work_id?: string | null
          author?: string
          author_id?: string | null
          content?: string
          timestamp?: string
          like_count?: number
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          work_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          work_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          work_id?: string
          created_at?: string
        }
      }
      contribution_likes: {
        Row: {
          id: string
          user_id: string
          contribution_id: string
          work_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contribution_id: string
          work_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contribution_id?: string
          work_id?: string
          created_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          work_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          work_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          work_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          work_id: string | null
          work_title: string
          type: string
          contributor_name: string
          timestamp: string
          is_read: boolean
        }
        Insert: {
          id?: string
          user_id: string
          work_id?: string | null
          work_title: string
          type: string
          contributor_name: string
          timestamp?: string
          is_read?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          work_id?: string | null
          work_title?: string
          type?: string
          contributor_name?: string
          timestamp?: string
          is_read?: boolean
        }
      }
      daily_contributions: {
        Row: {
          id: string
          user_id: string
          date: string
          contribution_count: number
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          contribution_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          contribution_count?: number
        }
      }
    }
    Views: {
      active_customers: {
        Row: {
          id: string
          nickname: string | null
          email: string | null
          apple_id: string | null
          created_at: string
          updated_at: string
        }
      }
    }
    Functions: {
      create_profile_simple: {
        Args: {
          user_id_param: string
          apple_id_param: string
        }
        Returns: void
      }
      restore_deleted_user: {
        Args: {
          target_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      user_status: 'active' | 'deleted' | 'inactive' | 'pending' | 'suspended'
      user_role: 'user' | 'admin'
    }
  }
}

// Additional type definitions for the app
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Work = Database['public']['Tables']['works']['Row']
export type Contribution = Database['public']['Tables']['contributions']['Row']
export type Like = Database['public']['Tables']['likes']['Row']
export type Bookmark = Database['public']['Tables']['bookmarks']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

// Extended types with relationships
export type WorkWithStats = Work & {
  contributions: Contribution[]
  author_profile?: Profile | null
}

export type ContributionWithWork = Contribution & {
  works?: Work | null
  author_profile?: Profile | null
}

// Dashboard stats types
export interface DashboardStats {
  totalUsers: number
  totalWorks: number
  totalContributions: number
  totalLikes: number
  activeUsers: number
  weeklyGrowth: {
    users: number
    works: number
    contributions: number
  }
}

// Chart data types
export interface ChartDataPoint {
  date: string
  users: number
  works: number
  contributions: number
}

// Category statistics
export interface CategoryStats {
  category: string
  count: number
  percentage: number
}