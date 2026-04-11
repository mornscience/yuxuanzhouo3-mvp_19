"use client"

import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { User, LogOut, Settings, Gift } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface UserAvatarDropdownProps {
  user: {
    userId: string
    email: string
    nickname: string
    avatar?: string
  }
  onLogout?: () => void
}

export function UserAvatarDropdown({ user, onLogout }: UserAvatarDropdownProps) {
  const router = useRouter()
  const isZh = (process.env.NEXT_PUBLIC_SITE_REGION ?? "auto").toLowerCase() === "cn"

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", { method: "POST" })
      if (res.ok) {
        localStorage.removeItem("market_user")
        toast({
          title: isZh ? "登出成功" : "Logged out",
          description: isZh ? "您已成功退出登录" : "You have been logged out successfully.",
        })
        onLogout?.()
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full p-0 hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300 ring-2 ring-transparent hover:ring-blue-500/30"
        >
          <Avatar className="h-10 w-10 ring-2 ring-white/50 dark:ring-white/20 shadow-md">
            <AvatarImage src={user.avatar} alt={user.nickname} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {user.nickname?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-72 p-2 overflow-visible" 
        align="end" 
        forceMount
        sideOffset={8}
      >
        {/* Glassmorphism background layer */}
        <div 
          className="absolute inset-0 -z-10 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(239,246,255,0.9) 50%, rgba(243,232,255,0.95) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.15), 0 0 0 1px rgba(255,255,255,0.5) inset'
          }}
        />
        
        <DropdownMenuLabel className="relative font-normal px-3 py-3 min-w-0">
          <div className="flex flex-col space-y-1.5">
            <p className="text-sm font-semibold text-slate-800 truncate" title={user.nickname}>
              {user.nickname}
            </p>
            <p className="text-xs text-slate-500 truncate font-mono" title={user.email}>
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-slate-200 to-transparent my-1" />
        
        <DropdownMenuItem 
          onClick={() => router.push("/market/profile")}
          className="px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
            text-slate-700
            hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/10 
            hover:text-blue-600
            focus:bg-gradient-to-r focus:from-blue-500/10 focus:to-cyan-500/10
            focus:text-blue-600"
        >
          <User className="mr-3 h-4 w-4 text-slate-400" />
          <span className="font-medium">{isZh ? "个人中心" : "Profile"}</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => router.push("/market/profile/edit")}
          className="px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
            text-slate-700
            hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 
            hover:text-purple-600
            focus:bg-gradient-to-r focus:from-purple-500/10 focus:to-pink-500/10
            focus:text-purple-600"
        >
          <Settings className="mr-3 h-4 w-4 text-slate-400" />
          <span className="font-medium">{isZh ? "账号设置" : "Settings"}</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => router.push("/market/invite")}
          className="px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
            text-slate-700
            hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-teal-500/10 
            hover:text-emerald-600
            focus:bg-gradient-to-r focus:from-emerald-500/10 focus:to-teal-500/10
            focus:text-emerald-600"
        >
          <Gift className="mr-3 h-4 w-4 text-slate-400" />
          <span className="font-medium">{isZh ? "邀请好友" : "Invite Friends"}</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-slate-200 to-transparent my-1" />
        
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
            text-red-500
            hover:bg-gradient-to-r hover:from-red-500/10 hover:to-orange-500/10 
            hover:text-red-600
            focus:bg-gradient-to-r focus:from-red-500/10 focus:to-orange-500/10
            focus:text-red-600"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="font-medium">{isZh ? "退出登录" : "Log out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
