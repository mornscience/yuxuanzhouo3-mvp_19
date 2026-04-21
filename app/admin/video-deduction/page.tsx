"use client";

/**
 * 管理后台 - 视频演绎页面
 *
 * 功能：
 * - 视频列表展示
 * - 上传视频
 * - 删除视频
 * - 选择当前播放视频
 */

import { useState, useEffect } from "react";
import {
  listVideos,
  createVideo,
  deleteVideo,
  activateVideo,
  type VideoDeduction,
} from "@/actions/admin-video-deduction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Play,
  Check,
  Video,
} from "lucide-react";

export default function VideoDeductionPage() {
  // 状态管理
  const [videos, setVideos] = useState<VideoDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 对话框状态
  const [creatingVideo, setCreatingVideo] = useState(false);
  const [deletingVideo, setDeletingVideo] = useState<VideoDeduction | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    title: "",
    file: null as File | null,
    fileSize: 0,
  });

  // 加载视频列表
  async function loadVideos() {
    setLoading(true);
    setError(null);

    try {
      const result = await listVideos();

      if (result.success && result.data) {
        setVideos(result.data);
      } else {
        setError(result.error || "加载失败");
      }
    } catch (err) {
      setError("加载视频失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, []);

  // 上传视频
  async function handleCreateVideo() {
    setSubmitting(true);
    setError(null);

    try {
      // 构造 FormData
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);

      // 添加文件
      if (formData.file) {
        formDataToSend.append("file", formData.file);
      } else {
        setError("请上传视频文件");
        setSubmitting(false);
        return;
      }

      const result = await createVideo(formDataToSend);

      if (result.success) {
        setCreatingVideo(false);
        resetForm();
        loadVideos();
      } else {
        setError(result.error || "创建失败");
      }
    } catch (err) {
      setError("创建失败");
    } finally {
      setSubmitting(false);
    }
  }

  // 删除视频
  async function handleDelete(video: VideoDeduction) {
    setSubmitting(true);

    try {
      const result = await deleteVideo(video.id);

      if (result.success) {
        setDeletingVideo(null);
        loadVideos();
      } else {
        setError(result.error || "删除失败");
      }
    } catch (err) {
      setError("删除失败");
    } finally {
      setSubmitting(false);
    }
  }

  // 激活视频
  async function handleActivate(video: VideoDeduction) {
    setSubmitting(true);

    try {
      const result = await activateVideo(video.id);

      if (result.success) {
        loadVideos();
      } else {
        setError(result.error || "激活失败");
      }
    } catch (err) {
      setError("激活失败");
    } finally {
      setSubmitting(false);
    }
  }

  // 重置表单
  function resetForm() {
    setFormData({
      title: "",
      file: null,
      fileSize: 0,
    });
  }

  // 打开创建对话框
  function openCreateDialog() {
    resetForm();
    setCreatingVideo(true);
  }

  // 格式化文件大小
  function formatFileSize(bytes: number): string {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  }

  // 格式化视频时长
  function formatDuration(seconds: number): string {
    if (!seconds) return "-";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  // 格式化上传时间
  function formatUploadTime(dateStr: string): string {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  }

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">视频演绎</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理视频演绎内容，选择当前播放的视频
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadVideos} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            上传视频
          </Button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 视频列表 */}
      <Card>
        <CardHeader>
          <CardTitle>视频列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无视频，请点击上方按钮上传
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">预览</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead className="w-[120px]">大小</TableHead>
                    <TableHead className="w-[100px]">时长</TableHead>
                    <TableHead className="w-[140px]">上传时间</TableHead>
                    <TableHead className="w-[100px]">状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10"
                          title="预览"
                        >
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                            <Video className="h-4 w-4 text-primary" />
                          </div>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{video.title}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {video.id.slice(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatFileSize(video.file_size || 0)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDuration(video.duration || 0)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatUploadTime(video.created_at)}
                      </TableCell>
                      <TableCell>
                        {video.is_active ? (
                          <Badge variant="default" className="bg-green-600 gap-1">
                            <Play className="h-3 w-3" />
                            当前播放
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Play className="h-3 w-3" />
                            未激活
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleActivate(video)}
                            title={video.is_active ? "已激活" : "设为当前播放"}
                            disabled={video.is_active || submitting}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="删除"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除视频 "{video.title}" 吗？此操作不可恢复。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    setDeletingVideo(video);
                                    handleDelete(video);
                                  }}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={submitting}
                                >
                                  {submitting ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      删除中...
                                    </>
                                  ) : (
                                    "删除"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 上传视频对话框 */}
      <Dialog open={creatingVideo} onOpenChange={(open) => {
        if (!open) {
          setCreatingVideo(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>上传视频</DialogTitle>
            <DialogDescription>
              上传新的视频演绎内容
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">视频标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="输入视频标题"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">上传视频 *</Label>
              <Input
                id="file"
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({
                      ...formData,
                      file: file,
                      fileSize: file.size,
                    });
                  }
                }}
              />
              {formData.fileSize > 0 && (
                <p className="text-sm text-muted-foreground">
                  文件大小: {formatFileSize(formData.fileSize)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreatingVideo(false);
                resetForm();
              }}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateVideo}
              disabled={submitting || !formData.title || !formData.file}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  上传中...
                </>
              ) : (
                "上传"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}