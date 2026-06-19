"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Search, RefreshCw, Eye, Play, Pause, CheckCircle, XCircle, Upload, Trash2, X } from "lucide-react";

interface VideoDeduction {
  id: string;
  video_url: string;
  video_name: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  file_size: number;
  duration: number;
}

export default function VideoDeductionPage() {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoDeduction[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadVideos() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.set('status', filterStatus);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await fetch(`/api/admin/video-deduction/active?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`加载失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.ok) {
        setVideos(result.data || []);
      } else {
        console.error('加载视频演绎记录失败:', result.error);
        setVideos([]);
      }
    } catch (error) {
      console.error('加载视频演绎记录失败:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, []);

  const filteredVideos = videos.filter(video => {
    if (filterStatus !== 'all' && video.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return video.video_name.toLowerCase().includes(query);
    }
    return true;
  });

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

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function formatDuration(seconds: number): string {
    if (seconds === 0) return "--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
            <Play className="h-3 w-3" />
            运行中
          </span>
        );
      case 'inactive':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
            <Pause className="h-3 w-3" />
            已停用
          </span>
        );
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{status}</span>;
    }
  }

  async function handleToggleStatus(videoId: string, currentStatus: string) {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const response = await fetch('/api/admin/video-deduction/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: videoId,
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error(`操作失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.ok) {
        loadVideos();
      } else {
        console.error('切换状态失败:', result.error);
      }
    } catch (error) {
      console.error('切换状态失败:', error);
      setVideos(videos.map(v => 
        v.id === videoId ? { ...v, status: currentStatus === 'active' ? 'inactive' : 'active' as const } : v
      ));
    }
  }

  async function handleDelete(videoId: string) {
    if (!confirm('确定要删除这个视频吗？')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/video-deduction/active', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: videoId })
      });

      if (!response.ok) {
        throw new Error(`删除失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.ok) {
        loadVideos();
      } else {
        console.error('删除失败:', result.error);
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  }

  async function handleUpload() {
    const fileInput = fileInputRef.current;
    if (!fileInput?.files?.[0]) {
      alert('请选择文件');
      return;
    }

    const file = fileInput.files[0];
    const title = uploadTitle || file.name.replace(/\.[^/.]+$/, '');

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);

      const response = await fetch('/api/admin/video-deduction/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`上传失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.ok) {
        setUploadDialogOpen(false);
        setUploadTitle('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        loadVideos();
      } else {
        alert(`上传失败: ${result.message}`);
      }
    } catch (error) {
      console.error('上传错误:', error);
      alert(`上传失败: ${(error as Error).message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">视频演绎</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理视频演绎任务，监控运行状态
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            上传视频
          </Button>
          <Button variant="outline" onClick={loadVideos} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="搜索视频名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">运行中</SelectItem>
            <SelectItem value="inactive">已停用</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>视频演绎列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              暂无视频演绎记录
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3 px-4">视频名称</th>
                    <th className="text-left py-3 px-4">文件大小</th>
                    <th className="text-left py-3 px-4">时长</th>
                    <th className="text-left py-3 px-4">状态</th>
                    <th className="text-left py-3 px-4">创建时间</th>
                    <th className="text-left py-3 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVideos.map((video) => (
                    <tr key={video.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                            <Play className="h-4 w-4 text-primary" />
                          </div>
                          <span className="truncate max-w-[250px]">{video.video_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span>{formatFileSize(video.file_size)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span>{formatDuration(video.duration)}</span>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(video.status)}</td>
                      <td className="py-3 px-4">{formatDate(video.created_at)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(video.video_url, '_blank')}
                            title="查看视频"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${video.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                            onClick={() => handleToggleStatus(video.id, video.status)}
                            title={video.status === 'active' ? '停用' : '激活'}
                          >
                            {video.status === 'active' ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(video.id)}
                            title="删除"
                          >
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

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>上传视频</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">视频标题</label>
              <Input
                placeholder="输入视频标题"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">视频文件</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary file:text-white
                  hover:file:bg-primary/90"
              />
              <p className="text-xs text-muted-foreground mt-1">
                支持格式: MP4, WebM, MOV, AVI
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
              <X className="h-4 w-4 mr-2" />
              取消
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  上传
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}