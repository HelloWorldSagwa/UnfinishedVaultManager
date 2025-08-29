'use client'

import { useState } from 'react'
import adminAuth from '@/lib/admin-auth-simple'

export default function SimpleLoginPage() {
  const [username, setUsername] = useState('superadmin')
  const [password, setPassword] = useState('Admin@2024!')
  const [message, setMessage] = useState('')

  const handleLoginClick = async () => {
    console.log('=== LOGIN CLICK ===')
    setMessage('Logging in...')
    
    try {
      const result = await adminAuth.login(username, password)
      console.log('Result:', result)
      
      if (result.success) {
        setMessage('Success! Redirecting...')
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      } else {
        setMessage('Failed: ' + result.message)
      }
    } catch (err: any) {
      console.error('Error:', err)
      setMessage('Error: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg w-96">
        <h1 className="text-white text-2xl mb-4">Simple Login Test</h1>
        
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
          placeholder="Username"
        />
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
          placeholder="Password"
        />
        
        <button
          onClick={handleLoginClick}
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Login
        </button>
        
        {message && (
          <div className="mt-4 p-2 bg-gray-700 text-white rounded">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}