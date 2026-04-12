"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

interface LoginPromptProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginPrompt({ isOpen, onClose }: LoginPromptProps) {
  const router = useRouter()

  const handleLogin = () => {
    onClose()
    // 保存当前路径到 localStorage，登录后可以跳转回来
    const currentPath = window.location.pathname + window.location.search
    localStorage.setItem('login_redirect', currentPath)
    router.push("/login")
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>You are not logged in</AlertDialogTitle>
          <AlertDialogDescription>
            You need to log in to use this feature. Go to the login page?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogin}>Log In</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
