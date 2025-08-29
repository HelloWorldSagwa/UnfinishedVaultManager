import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to login page since this is an admin-only dashboard
  redirect('/login')
}
