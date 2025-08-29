# UnfinishedVault Admin Dashboard

A comprehensive administrative dashboard for managing the UnfinishedVault creative collaboration platform. This Next.js application provides powerful tools for platform administrators to manage users, works, contributions, and generate test data.

## 🌟 Features

### 📊 Dashboard Analytics
- Real-time statistics overview
- User activity tracking
- Growth metrics and charts
- Category distribution analytics

### 👥 User Management
- View and manage all user accounts
- Change user roles (User/Admin)
- Update user status (Active/Inactive/Suspended/Deleted)
- User activity monitoring

### 📝 Content Management
- View and manage all works
- Toggle work visibility (Public/Private)
- Monitor completion rates and engagement
- Delete inappropriate content

### 🔧 Development Tools
- **Dummy Data Generator**: Create realistic test data
- Multiple content categories (Poetry, Novels, Essays, Scenarios)
- Automatic contribution generation
- Bulk data operations

### 🎨 Modern UI/UX
- Dark/Light theme toggle
- Responsive design for all devices
- Collapsible sidebar navigation
- Sortable and searchable tables
- Real-time data updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account and project

### Installation

1. **Clone and setup**
```bash
git clone <repository-url>
cd ManageUnfinishedVault
npm install
```

2. **Configure Environment Variables**
Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://qmmryvzwzzlirvznbexp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

3. **Database Setup**
Run the admin accounts table creation script in Supabase SQL Editor:

```bash
# Execute the SQL file in Supabase Dashboard
sql/create_admin_accounts.sql

# Then run the setup script to create initial accounts
node scripts/setup-admin.js
```

Default admin accounts:
- **Super Admin**: `superadmin` / `Admin@2024!`
- **Admin**: `admin` / `Admin@2024!`
- **Moderator**: `moderator` / `Mod@2024!`
- **Viewer**: `viewer` / `View@2024!`

4. **Start Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000` - you'll be redirected to the login page.

## 🗂️ Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/                 # Authentication pages
│   ├── (dashboard)/
│   │   └── dashboard/             # Protected admin pages
│   │       ├── page.tsx           # Analytics dashboard
│   │       ├── works/             # Works management
│   │       ├── users/             # User management
│   │       └── dummy-data/        # Data generation tools
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Root redirect
├── components/
│   ├── ui/                        # Reusable UI components
│   │   ├── data-table.tsx         # Sortable data table
│   │   └── stat-card.tsx          # Statistics cards
│   └── layout/
│       └── sidebar.tsx            # Navigation sidebar
├── lib/
│   └── supabase/                  # Supabase configuration
│       ├── client.ts              # Client-side config
│       ├── server.ts              # Server-side config
│       └── middleware.ts          # Auth middleware
└── types/
    └── database.ts                # TypeScript definitions
```

## 🔐 Authentication & Security

### Admin Access Requirements
- Separate admin account system (not iOS app users)
- Four role levels:
  - `super_admin`: Full system control
  - `admin`: User and content management
  - `moderator`: Content moderation only
  - `viewer`: Read-only access

### Security Features
- Route protection with middleware
- Admin role verification
- Secure headers configuration
- CSRF protection
- No search engine indexing

## 📊 Database Schema

The dashboard works with the following key tables:

### Core Tables
- `profiles` - User accounts and roles
- `works` - Creative works/posts
- `contributions` - Collaborative additions to works
- `likes` - User likes on works/contributions
- `bookmarks` - User bookmarks
- `notifications` - System notifications

### Statistics Views
- Real-time analytics
- Growth tracking
- Category breakdowns
- User engagement metrics

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run start        # Start production server
```

### Key Technologies
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling system
- **Supabase** - Backend and authentication
- **Recharts** - Data visualization
- **Lucide React** - Icon system

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Import project to Vercel
   - Connect your Git repository

2. **Configure Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Deploy**
   - Automatic deployment on push
   - Preview deployments for PRs

### Manual Deployment

```bash
npm run build
npm run start
```

## 🔧 Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |

### Next.js Configuration
- Optimized package imports
- Security headers
- Image optimization
- Automatic redirects

## 📖 Usage Guide

### First Time Setup
1. Deploy the application
2. Create an admin account in Supabase
3. Set user role to 'admin' in the profiles table
4. Login to the dashboard

### Managing Content
- **Works**: View, edit visibility, monitor engagement
- **Users**: Manage roles and account status  
- **Data**: Generate test content for development

### Analytics
- Monitor user growth and activity
- Track content creation trends
- View engagement metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the UnfinishedVault platform - contact the development team for licensing information.

## 🆘 Support

For technical support or questions:
- Check existing issues
- Create new issue with detailed description
- Contact the UnfinishedVault development team

---

**Built with ❤️ for the UnfinishedVault community**
