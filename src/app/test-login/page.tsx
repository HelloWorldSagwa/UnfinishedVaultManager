'use client'

import { useState } from 'react'

export default function TestLogin() {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    console.log('Button clicked!', count)
    setCount(count + 1)
    
    // 3초 후 리다이렉트 테스트
    if (count === 2) {
      console.log('Redirecting...')
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg">
        <h1 className="text-white text-2xl mb-4">Test Page</h1>
        <p className="text-gray-400 mb-4">Click count: {count}</p>
        
        <button
          type="button"
          onClick={handleClick}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Click me (redirect at 3)
        </button>
        
        <div className="mt-4">
          <a href="/dashboard" className="text-blue-400 underline">
            Direct link to dashboard
          </a>
        </div>
      </div>
    </div>
  )
}