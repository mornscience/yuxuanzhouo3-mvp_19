import { useState, useEffect } from 'react'

export type User = {
  userId: string
  email: string
  nickname: string
  avatar?: string
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 从 localStorage 获取用户信息
    try {
      const storedUser = localStorage.getItem('market_user')
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  return { user, loading }
}
