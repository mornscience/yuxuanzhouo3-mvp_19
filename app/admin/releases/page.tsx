"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, RefreshCw, Smartphone, Monitor, Apple, ExternalLink, Download, Edit, Trash2, Upload } from "lucide-react";

interface AppRelease {
  id: string;
  platform: string;
  version: string;
  build_number: string;
  release_notes: string;
  file_url: string;
  file_size?: number;
  is_mandatory: boolean;
  status: 'published' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
}

export default function ReleasesPage() {
  const [loading, setLoading] = useState(true);
  const [releases, setReleases] = useState<AppRelease[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    platform: 'android',
    version: '',
    buildNumber: '',
    releaseNotes: '',
    fileUrl: '',
    fileSize: 0,
    isMandatory: false,
    status: 'draft' as 'published' | 'draft' | 'archived',
  });
  const [uploading, setUploading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentRelease, setCurrentRelease] = useState<AppRelease | null>(null);

  // 刷新函数（从API获取数据）
  async function loadReleases() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/releases', {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.ok) {
        setReleases(result.data);
      }
    } catch (error) {
      console.error('加载发布版本失败:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReleases();
  }, []);

  function formatFileSize(bytes?: number): string {
    if (!bytes) return "未知";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "无效日期";
    }
  }

  function getPlatformIcon(platform: string) {
    switch (platform) {
      case 'android': return <Smartphone className="h-4 w-4" />;
      case 'ios': return <Apple className="h-4 w-4" />;
      case 'harmony': return <Smartphone className="h-4 w-4" />;
      case 'web': return <Monitor className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'published':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">已发布</span>;
      case 'draft':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">草稿</span>;
      case 'archived':
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">已归档</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{status}</span>;
    }
  }

  // 处理文件上传
  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      const ext = file.name.split('.').pop();
      const safeFileName = `releases/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      formData.append('file', file);
      formData.append('bucket', 'apks');
      formData.append('path', safeFileName);

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();
      if (result.ok) {
        return {
          url: result.data.videoUrl,
          size: file.size
        };
      } else {
        throw new Error(result.message || '文件上传失败');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  }

  // 处理编辑
  function handleEdit(release: AppRelease) {
    setCurrentRelease(release);
    setFormData({
      platform: release.platform,
      version: release.version,
      buildNumber: release.build_number,
      releaseNotes: release.release_notes,
      fileUrl: release.file_url,
      fileSize: release.file_size || 0,
      isMandatory: release.is_mandatory,
      status: release.status
    });
    setShowEditDialog(true);
  }

  // 处理删除
  async function handleDelete(releaseId: string) {
    if (confirm('确定要删除这个发布版本吗？')) {
      try {
        const response = await fetch('/api/admin/releases', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: releaseId })
        });

        const result = await response.json();
        if (result.ok) {
          loadReleases();
        } else {
          console.error('删除失败:', result.error);
        }
      } catch (error) {
        console.error('删除失败:', error);
      }
    }
  }

  // 处理下载
  function handleDownload(fileUrl: string) {
    window.open(fileUrl, '_blank');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">发布版本管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理Android、iOS和Web应用的发布版本
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadReleases} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建版本
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>发布版本列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : releases.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              暂无发布版本
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3 px-4">平台</th>
                    <th className="text-left py-3 px-4">版本</th>
                    <th className="text-left py-3 px-4">构建号</th>
                    <th className="text-left py-3 px-4">文件大小</th>
                    <th className="text-left py-3 px-4">状态</th>
                    <th className="text-left py-3 px-4">强制更新</th>
                    <th className="text-left py-3 px-4">创建时间</th>
                    <th className="text-left py-3 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {releases.map((release) => (
                    <tr key={release.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(release.platform)}
                          <span className="capitalize">{release.platform}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{release.version}</td>
                      <td className="py-3 px-4">{release.build_number}</td>
                      <td className="py-3 px-4">{formatFileSize(release.file_size)}</td>
                      <td className="py-3 px-4">{getStatusBadge(release.status)}</td>
                      <td className="py-3 px-4">
                        <Switch checked={release.is_mandatory} disabled />
                      </td>
                      <td className="py-3 px-4">{formatDate(release.created_at)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(release.file_url)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(release)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleDelete(release.id)}>
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
              <CardTitle>新建发布版本</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">平台</Label>
                <Select value={formData.platform} onValueChange={(value) => setFormData({...formData, platform: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="android">Android</SelectItem>
                    <SelectItem value="ios">iOS</SelectItem>
                    <SelectItem value="harmony">HarmonyOS</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">版本号</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({...formData, version: e.target.value})}
                  placeholder="例如: 1.2.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildNumber">构建号</Label>
                <Input
                  id="buildNumber"
                  value={formData.buildNumber}
                  onChange={(e) => setFormData({...formData, buildNumber: e.target.value})}
                  placeholder="例如: 102"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="releaseNotes">发布说明</Label>
                <Textarea
                  id="releaseNotes"
                  value={formData.releaseNotes}
                  onChange={(e) => setFormData({...formData, releaseNotes: e.target.value})}
                  placeholder="输入本次更新的内容说明"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fileUrl">文件</Label>
                <div className="space-y-2">
                  <Input
                    id="fileUrl"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
                    placeholder="https://example.com/app-v1.2.0.apk"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.apk,.ipa,.hap,.zip';
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          try {
                            const result = await handleFileUpload(file);
                            setFormData({
                              ...formData,
                              fileUrl: result.url,
                              fileSize: result.size
                            });
                          } catch (error) {
                            alert('文件上传失败，请重试');
                          }
                        }
                      };
                      input.click();
                    }}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? '上传中...' : '上传文件'}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isMandatory"
                  checked={formData.isMandatory}
                  onCheckedChange={(checked) => setFormData({...formData, isMandatory: checked})}
                />
                <Label htmlFor="isMandatory">强制更新</Label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  取消
                </Button>
                <Button onClick={async () => {
                  try {
                    // 客户端验证
                    if (!formData.platform) {
                      alert('请选择平台');
                      return;
                    }
                    if (!formData.version) {
                      alert('请输入版本号');
                      return;
                    }
                    if (!formData.fileUrl) {
                      alert('请上传文件或输入文件URL');
                      return;
                    }
                    
                    const response = await fetch('/api/admin/releases', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                          platform: formData.platform,
                          version: formData.version,
                          buildNumber: formData.buildNumber,
                          releaseNotes: formData.releaseNotes,
                          fileUrl: formData.fileUrl,
                          fileSize: formData.fileSize,
                          isMandatory: formData.isMandatory,
                          status: formData.status
                        })
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(`创建失败: ${errorData.error || response.status}`);
                    }

                    const result = await response.json();
                    if (result.ok) {
                      setShowCreateDialog(false);
                      loadReleases();
                    } else {
                      console.error('创建发布版本失败:', result.error);
                      alert(`创建失败: ${result.error}`);
                    }
                  } catch (error) {
                    console.error('创建发布版本失败:', error);
                    alert(`创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
                  }
                }}>
                  创建
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 编辑对话框 */}
      {showEditDialog && currentRelease && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>编辑发布版本</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">平台</Label>
                <Select value={formData.platform} onValueChange={(value) => setFormData({...formData, platform: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="android">Android</SelectItem>
                    <SelectItem value="ios">iOS</SelectItem>
                    <SelectItem value="harmony">HarmonyOS</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">版本号</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({...formData, version: e.target.value})}
                  placeholder="例如: 1.2.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildNumber">构建号</Label>
                <Input
                  id="buildNumber"
                  value={formData.buildNumber}
                  onChange={(e) => setFormData({...formData, buildNumber: e.target.value})}
                  placeholder="例如: 102"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="releaseNotes">发布说明</Label>
                <Textarea
                  id="releaseNotes"
                  value={formData.releaseNotes}
                  onChange={(e) => setFormData({...formData, releaseNotes: e.target.value})}
                  placeholder="输入本次更新的内容说明"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fileUrl">文件</Label>
                <div className="space-y-2">
                  <Input
                    id="fileUrl"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
                    placeholder="https://example.com/app-v1.2.0.apk"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.apk,.ipa,.hap,.zip';
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          try {
                            const result = await handleFileUpload(file);
                            setFormData({
                              ...formData,
                              fileUrl: result.url,
                              fileSize: result.size
                            });
                          } catch (error) {
                            alert('文件上传失败，请重试');
                          }
                        }
                      };
                      input.click();
                    }}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? '上传中...' : '上传文件'}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isMandatory"
                  checked={formData.isMandatory}
                  onCheckedChange={(checked) => setFormData({...formData, isMandatory: checked})}
                />
                <Label htmlFor="isMandatory">强制更新</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="status">状态</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as 'draft' | 'published' | 'archived'})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  取消
                </Button>
                <Button onClick={async () => {
                  try {
                    // 客户端验证
                    if (!formData.platform) {
                      alert('请选择平台');
                      return;
                    }
                    if (!formData.version) {
                      alert('请输入版本号');
                      return;
                    }
                    if (!formData.fileUrl) {
                      alert('请上传文件或输入文件URL');
                      return;
                    }
                    
                    const response = await fetch('/api/admin/releases', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                          id: currentRelease.id,
                          platform: formData.platform,
                          version: formData.version,
                          buildNumber: formData.buildNumber,
                          releaseNotes: formData.releaseNotes,
                          fileUrl: formData.fileUrl,
                          fileSize: formData.fileSize,
                          isMandatory: formData.isMandatory,
                          status: formData.status
                        })
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(`更新失败: ${errorData.error || response.status}`);
                    }

                    const result = await response.json();
                    if (result.ok) {
                      setShowEditDialog(false);
                      loadReleases();
                    } else {
                      console.error('更新发布版本失败:', result.error);
                      alert(`更新失败: ${result.error}`);
                    }
                  } catch (error) {
                    console.error('更新发布版本失败:', error);
                    alert(`更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
                  }
                }}>
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}