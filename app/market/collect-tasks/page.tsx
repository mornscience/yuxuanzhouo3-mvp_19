"use client"

import { useState } from 'react'
import { useUser } from '@/lib/auth/use-user'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent } from '@/components/ui/tabs'
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
          <AlertTitle>Please log in</AlertTitle>
          <AlertDescription>You need to be logged in to use the lead collection feature</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold flex items-center tracking-tight">
            <span className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-2 rounded-xl mr-3 shadow-lg shadow-orange-500/25">
              <Search size={28} />
            </span>
            <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Lead Collection System
            </span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">AI-powered intelligent lead collection & management</p>
        </div>
        <Button asChild>
          <Link href="/market">Back to Market</Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6 p-1.5 rounded-2xl gap-1"
          style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(203,213,225,0.5)', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
          {[
            { key: "blogger", label: "Blogger Collect", gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' },
            { key: "enterprise", label: "Enterprise Collect", gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' },
            { key: "vc", label: "VC Collect", gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)' },
          ].map(({ key, label, gradient }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`relative rounded-xl text-sm font-medium transition-all duration-300 py-2.5 overflow-hidden ${activeTab === key ? 'text-white shadow-lg' : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'}`}
              style={{ background: activeTab === key ? gradient : 'transparent' }}>
              {label}
            </button>
          ))}
        </div>

        <TabsContent value="blogger" className="space-y-6">
          <Card><div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg"><Users size={32} /></div>
              <div><h2 className="text-2xl font-bold text-slate-800">Blogger Collect Tasks</h2><p className="text-slate-500 mt-1">AI-powered blogger data collection with auto dedup</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: Search, color: "blue", title: "New Collect Task", desc: "Select platform, enter keyword, set limit", href: "/market/collect-tasks/manage", label: "Manage Tasks" },
                { icon: Database, color: "cyan", title: "Collected Data", desc: "View collected blogger data and sync to pool", href: "/market/collect-temp", label: "View Data" },
                { icon: CheckCircle, color: "indigo", title: "Blogger Pool", desc: "Manage synced blogger leads, send invites", href: "/market/bloggers-pool", label: "Manage Leads" },
                { icon: Clock, color: "purple", title: "Email Templates", desc: "Create templates for blogger cooperation invites", href: "/market/email-templates", label: "Manage Templates" },
              ].map(({ icon: Icon, color, title, desc, href, label }) => (
                <div key={href} className={`rounded-2xl p-6 border border-slate-200 hover:border-${color}-300 hover:shadow-md transition-all duration-300`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center text-${color}-600`}><Icon size={20} /></div>
                    <h3 className="font-bold text-slate-800">{title}</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">{desc}</p>
                  <Button asChild className={`w-full bg-${color}-600 hover:bg-${color}-700`}><Link href={href}>{label}</Link></Button>
                </div>
              ))}
            </div>
          </div></Card>
        </TabsContent>

        <TabsContent value="enterprise" className="space-y-6">
          <Card><div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg"><Building2 size={32} /></div>
              <div><h2 className="text-2xl font-bold text-slate-800">Enterprise Collect Tasks</h2><p className="text-slate-500 mt-1">AI-powered enterprise data collection with auto dedup</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: Search, color: "purple", title: "New Collect Task", desc: "Select platform, enter industry keyword, set limit", href: "/market/enterprise-collect-tasks", label: "Manage Tasks" },
                { icon: Database, color: "pink", title: "Collected Data", desc: "View collected enterprise data and sync to pool", href: "/market/enterprise-collect-temp", label: "View Data" },
                { icon: CheckCircle, color: "indigo", title: "Enterprise Pool", desc: "Manage synced enterprise leads, send invites", href: "/market/enterprise-pool", label: "Manage Leads" },
                { icon: Clock, color: "blue", title: "Email Templates", desc: "Create templates for enterprise cooperation invites", href: "/market/enterprise-email-templates", label: "Manage Templates" },
              ].map(({ icon: Icon, color, title, desc, href, label }) => (
                <div key={href} className={`rounded-2xl p-6 border border-slate-200 hover:border-${color}-300 hover:shadow-md transition-all duration-300`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center text-${color}-600`}><Icon size={20} /></div>
                    <h3 className="font-bold text-slate-800">{title}</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">{desc}</p>
                  <Button asChild className={`w-full bg-${color}-600 hover:bg-${color}-700`}><Link href={href}>{label}</Link></Button>
                </div>
              ))}
            </div>
          </div></Card>
        </TabsContent>

        <TabsContent value="vc" className="space-y-6">
          <Card><div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg"><Landmark size={32} /></div>
              <div><h2 className="text-2xl font-bold text-slate-800">VC Collect Tasks</h2><p className="text-slate-500 mt-1">AI-powered VC institution data collection with auto dedup</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: Search, color: "emerald", title: "New Collect Task", desc: "Select platform, enter investment track, set limit", href: "/market/vc-collect-tasks", label: "Manage Tasks" },
                { icon: Database, color: "teal", title: "Collected Data", desc: "View collected VC data and sync to pool", href: "/market/vc-collect-temp", label: "View Data" },
                { icon: CheckCircle, color: "indigo", title: "VC Pool", desc: "Manage synced VC leads, send project invites", href: "/market/vc-pool", label: "Manage Leads" },
                { icon: Clock, color: "blue", title: "Email Templates", desc: "Create templates for VC project connection invites", href: "/market/vc-email-templates", label: "Manage Templates" },
              ].map(({ icon: Icon, color, title, desc, href, label }) => (
                <div key={href} className={`rounded-2xl p-6 border border-slate-200 hover:border-${color}-300 hover:shadow-md transition-all duration-300`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center text-${color}-600`}><Icon size={20} /></div>
                    <h3 className="font-bold text-slate-800">{title}</h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">{desc}</p>
                  <Button asChild className={`w-full bg-${color}-600 hover:bg-${color}-700`}><Link href={href}>{label}</Link></Button>
                </div>
              ))}
            </div>
          </div></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
