"use client"

import { useState } from 'react'
import { useUser } from '@/lib/auth/use-user'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Users, Building2, Landmark, Search, Clock, Database, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function CollectTasksPage() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('blogger')

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTitle>请先登录</AlertTitle>
          <AlertDescription>登录后才能使用线索采集功能</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center tracking-tight">
            <span className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-2 rounded-xl mr-3 shadow-lg shadow-orange-500/25">
              <Search size={28} />
            </span>
            <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              线索采集系统
            </span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">AI 驱动的智能线索采集与管理</p>
        </div>
        <Button asChild>
          <Link href="/market">
            返回市场主页
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div 
          className="grid w-full grid-cols-3 mb-6 p-1.5 rounded-2xl gap-1"
          style={{
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(203,213,225,0.5)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
          }}
        >
          <button 
            onClick={() => setActiveTab("blogger")}
            className={`relative rounded-xl text-sm font-medium transition-all duration-300 py-2.5 overflow-hidden ${
              activeTab === "blogger"
                ? 'text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
            }`}
            style={{
              background: activeTab === "blogger"
                ? 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)'
                : 'transparent'
            }}
          >
            博主采集
          </button>
          <button 
            onClick={() => setActiveTab("enterprise")}
            className={`relative rounded-xl text-sm font-medium transition-all duration-300 py-2.5 overflow-hidden ${
              activeTab === "enterprise"
                ? 'text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
            }`}
            style={{
              background: activeTab === "enterprise"
                ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
                : 'transparent'
            }}
          >
            企业采集
          </button>
          <button 
            onClick={() => setActiveTab("vc")}
            className={`relative rounded-xl text-sm font-medium transition-all duration-300 py-2.5 overflow-hidden ${
              activeTab === "vc"
                ? 'text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
            }`}
            style={{
              background: activeTab === "vc"
                ? 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)'
                : 'transparent'
            }}
          >
            VC 采集
          </button>
        </div>

        <TabsContent value="blogger" className="space-y-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                  <Users size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">博主采集任务</h2>
                  <p className="text-slate-500 mt-1">AI 智能抓取博主信息，自动清洗去重</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                      <Search size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800">新建采集任务</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">选择平台，输入领域关键词，设置采集上限</p>
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link href="/market/collect-tasks/manage">
                      管理任务
                    </Link>
                  </Button>
                </div>
                
                <div className="rounded-2xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600">
                      <Database size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800">采集临时数据</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">查看采集到的博主数据，清洗去重后同步到线索池</p>
                  <Button asChild className="w-full bg-cyan-600 hover:bg-cyan-700">
                    <Link href="/market/collect-temp">
                      查看数据
                    </Link>
                  </Button>
                </div>
                
                <div className="rounded-2xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <CheckCircle size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800">博主线索池</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">管理已同步的博主线索，进行邮件邀约和合作确认</p>
                  <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
                    <Link href="/market/bloggers-pool">
                      管理线索
                    </Link>
                  </Button>
                </div>
                
                <div className="rounded-2xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                      <Clock size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800">邮件模板管理</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">创建和管理邮件模板，用于向博主发送合作邀约</p>
                  <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                    <Link href="/market/email-templates">
                      管理模板
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="enterprise" className="space-y-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
                  <Building2 size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">企业采集任务</h2>
                  <p className="text-slate-500 mt-1">AI 智能抓取企业信息，自动清洗去重</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl p-6 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                      <Search size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800">新建采集任务</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">选择来源平台，输入行业关键词，设置采集上限</p>
                  <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                    <Link href="/market/enterprise-collect-tasks">
                      管理任务
                    </Link>
                  </Button>
                </div>
                
                <div className="rounded-2xl p-6 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                      <Database size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800">采集临时数据</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">查看采集到的企业数据，清洗去重后同步到线索池</p>
                  <Button asChild className="w-full bg-pink-600 hover:bg-pink-700">
                    <Link href="/market/enterprise-collect-temp">
                      查看数据
                    </Link>
                  </Button>
                </div>
                
                <div className="rounded-2xl p-6 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <CheckCircle size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800">企业线索池</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">管理已同步的企业线索，进行邮件邀约和合作确认</p>
                  <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
                    <Link href="/market/enterprise-pool">
                      管理线索
                    </Link>
                  </Button>
                </div>
                
                <div className="rounded-2xl p-6 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                      <Clock size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800">邮件模板管理</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">创建和管理邮件模板，用于向企业发送合作邀约</p>
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link href="/market/enterprise-email-templates">
                      管理模板
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="vc" className="space-y-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg">
                  <Landmark size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">VC 采集任务</h2>
                  <p className="text-slate-500 mt-1">AI 智能抓取投资机构信息，自动清洗去重</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Search size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800">新建采集任务</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">选择来源平台，输入投资赛道，设置采集上限</p>
                  <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Link href="/market/vc-collect-tasks">
                      管理任务
                    </Link>
                  </Button>
                </div>
                
                <div className="rounded-2xl p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600">
                      <Database size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800">采集临时数据</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">查看采集到的 VC 数据，清洗去重后同步到线索池</p>
                  <Button asChild className="w-full bg-teal-600 hover:bg-teal-700">
                    <Link href="/market/vc-collect-temp">
                      查看数据
                    </Link>
                  </Button>
                </div>
                
                <div className="rounded-2xl p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <CheckCircle size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800">VC 线索池</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">管理已同步的 VC 线索，进行邮件邀约和合作确认</p>
                  <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
                    <Link href="/market/vc-pool">
                      管理线索
                    </Link>
                  </Button>
                </div>
                
                <div className="rounded-2xl p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                      <Clock size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800">邮件模板管理</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">创建和管理邮件模板，用于向 VC 发送项目对接邀请</p>
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link href="/market/vc-email-templates">
                      管理模板
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
