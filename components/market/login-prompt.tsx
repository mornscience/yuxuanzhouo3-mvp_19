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
          <AlertDialogTitle>您还没有登录</AlertDialogTitle>
          <AlertDialogDescription>
            您还没有登录，不能使用该功能。是否前往登录页面？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogin}>去登录</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
