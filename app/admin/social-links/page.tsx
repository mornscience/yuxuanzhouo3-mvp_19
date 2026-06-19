"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, RefreshCw, Link as LinkIcon, Globe, Youtube, Twitter, Facebook, Instagram, Github, Edit, Trash2, ExternalLink } from "lucide-react";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon_url?: string;
  display_order: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export default function SocialLinksPage() {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    platform: 'website',
    url: '',
    iconUrl: '',
    display_order: 0,
    status: 'active' as const,
  });

  async function loadLinks() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/social-links', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`加载失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.ok) {
        setLinks(result.data);
      } else {
        console.error('加载社交链接失败:', result.error);
      }
    } catch (error) {
      console.error('加载社交链接失败:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLinks();
  }, []);

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "无效日期";
    }
  }

  function getPlatformIcon(platform: string) {
    switch (platform) {
      case 'website': return <Globe className="h-4 w-4" />;
      case 'github': return <Github className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      default: return <LinkIcon className="h-4 w-4" />;
    }
  }

  function getPlatformName(platform: string): string {
    switch (platform) {
      case 'website': return '官方网站';
      case 'github': return 'GitHub';
      case 'twitter': return 'Twitter';
      case 'youtube': return 'YouTube';
      case 'facebook': return 'Facebook';
      case 'instagram': return 'Instagram';
      default: return platform;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">启用</span>;
      case 'inactive':
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">禁用</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{status}</span>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">社交链接管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理网站、社交媒体等外部链接
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadLinks} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建链接
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>社交链接列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              暂无社交链接
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3 px-4">排序</th>
                    <th className="text-left py-3 px-4">平台</th>
                    <th className="text-left py-3 px-4">链接</th>
                    <th className="text-left py-3 px-4">状态</th>
                    <th className="text-left py-3 px-4">创建时间</th>
                    <th className="text-left py-3 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{link.display_order}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(link.platform)}
                          <span>{getPlatformName(link.platform)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {link.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(link.status)}</td>
                      <td className="py-3 px-4">{formatDate(link.created_at)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建对话框 - 简化版 */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>新建社交链接</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">平台</Label>
                <Select value={formData.platform} onValueChange={(value) => setFormData({...formData, platform: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">官方网站</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">链接地址</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  placeholder="https://example.com"
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="iconUrl">图标URL (可选)</Label>
                <Input
                  id="iconUrl"
                  value={formData.iconUrl}
                  onChange={(e) => setFormData({...formData, iconUrl: e.target.value})}
                  placeholder="https://example.com/icon.png"
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">排序</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                  placeholder="数字越小越靠前"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  取消
                </Button>
                <Button onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/social-links', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        platform: formData.platform,
                        url: formData.url,
                        iconUrl: formData.iconUrl || undefined,
                        displayOrder: formData.display_order,
                        status: formData.status
                      })
                    });

                    if (!response.ok) {
                      throw new Error(`创建失败: ${response.status}`);
                    }

                    const result = await response.json();
                    if (result.ok) {
                      setShowCreateDialog(false);
                      loadLinks();
                    } else {
                      console.error('创建社交链接失败:', result.error);
                    }
                  } catch (error) {
                    console.error('创建社交链接失败:', error);
                  }
                }}>
                  创建
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}