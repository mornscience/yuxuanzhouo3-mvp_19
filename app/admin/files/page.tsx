"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ExternalLink, Cloud, Database, FileIcon, Eye, Trash2, Download, Package, Smartphone, Link as LinkIcon, Apple } from "lucide-react";

interface StorageFile {
  name: string;
  url: string;
  size?: number;
  lastModified?: string;
  source: 'cloudbase' | 'supabase';
}

interface ReleaseFile extends StorageFile {
  platform?: string;
  version?: string;
}

interface SocialLinkFile extends StorageFile {
  linkId?: string;
}

export default function FilesManagementPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adsFiles, setAdsFiles] = useState<StorageFile[]>([]);
  const [releaseFiles, setReleaseFiles] = useState<ReleaseFile[]>([]);
  const [socialFiles, setSocialFiles] = useState<SocialLinkFile[]>([]);
  const [activeTab, setActiveTab] = useState("ads");

  async function loadFiles() {
    setLoading(true);
    setError(null);
    try {
      // 暂时使用模拟数据
      setAdsFiles([]);
      setReleaseFiles([]);
      setSocialFiles([]);
    } catch (err) {
      setError("加载文件列表失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  function formatFileSize(bytes?: number): string {
    if (!bytes) return "未知";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return "未知";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">文件管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理广告文件、发布版本和社交链接图标
          </p>
        </div>
        <Button variant="outline" onClick={loadFiles} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      {error && (
        <Card className="border-red-600">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ads">广告文件</TabsTrigger>
          <TabsTrigger value="releases">发布版本</TabsTrigger>
          <TabsTrigger value="social">社交链接</TabsTrigger>
        </TabsList>

        {/* 广告文件 */}
        <TabsContent value="ads">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileIcon className="h-5 w-5" />
                广告文件
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : adsFiles.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  暂无广告文件
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-3 px-4">文件名</th>
                        <th className="text-left py-3 px-4">大小</th>
                        <th className="text-left py-3 px-4">修改时间</th>
                        <th className="text-left py-3 px-4">来源</th>
                        <th className="text-left py-3 px-4">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adsFiles.map((file, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{file.name}</td>
                          <td className="py-3 px-4">{formatFileSize(file.size)}</td>
                          <td className="py-3 px-4">{formatDate(file.lastModified)}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-muted">
                              {file.source === 'cloudbase' ? <Cloud className="h-3 w-3" /> : <Database className="h-3 w-3" />}
                              {file.source === 'cloudbase' ? 'CloudBase' : 'Supabase'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Download className="h-4 w-4" />
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
        </TabsContent>

        {/* 发布版本 */}
        <TabsContent value="releases">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                发布版本文件
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : releaseFiles.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  暂无发布版本文件
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-3 px-4">文件名</th>
                        <th className="text-left py-3 px-4">平台</th>
                        <th className="text-left py-3 px-4">版本</th>
                        <th className="text-left py-3 px-4">大小</th>
                        <th className="text-left py-3 px-4">修改时间</th>
                        <th className="text-left py-3 px-4">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {releaseFiles.map((file, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{file.name}</td>
                          <td className="py-3 px-4">
                            {file.platform === 'android' ? (
                              <span className="inline-flex items-center gap-1">
                                <Smartphone className="h-3 w-3" /> Android
                              </span>
                            ) : file.platform === 'ios' ? (
                              <span className="inline-flex items-center gap-1">
                                <Apple className="h-3 w-3" /> iOS
                              </span>
                            ) : file.platform === 'web' ? (
                              <span className="inline-flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" /> Web
                              </span>
                            ) : (
                              file.platform || '-'
                            )}
                          </td>
                          <td className="py-3 px-4">{file.version || '-'}</td>
                          <td className="py-3 px-4">{formatFileSize(file.size)}</td>
                          <td className="py-3 px-4">{formatDate(file.lastModified)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Download className="h-4 w-4" />
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
        </TabsContent>

        {/* 社交链接 */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                社交链接图标
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : socialFiles.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  暂无社交链接图标
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-3 px-4">文件名</th>
                        <th className="text-left py-3 px-4">大小</th>
                        <th className="text-left py-3 px-4">修改时间</th>
                        <th className="text-left py-3 px-4">来源</th>
                        <th className="text-left py-3 px-4">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {socialFiles.map((file, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{file.name}</td>
                          <td className="py-3 px-4">{formatFileSize(file.size)}</td>
                          <td className="py-3 px-4">{formatDate(file.lastModified)}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-muted">
                              {file.source === 'cloudbase' ? <Cloud className="h-3 w-3" /> : <Database className="h-3 w-3" />}
                              {file.source === 'cloudbase' ? 'CloudBase' : 'Supabase'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Download className="h-4 w-4" />
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
        </TabsContent>
      </Tabs>
    </div>
  );
}