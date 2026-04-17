"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, RefreshCw, Eye, CheckCircle, XCircle, AlertTriangle, User, UserX } from "lucide-react";

interface Report {
  id: string;
  reporter_user_id?: string;
  reporter_email?: string;
  reported_user_id?: string;
  reported_user_email?: string;
  report_type: 'spam' | 'harassment' | 'inappropriate' | 'other';
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // 刷新函数（使用静态数据）
  function loadReports() {
    setLoading(true);
    // 模拟加载延迟
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }

  // 静态举报数据
  const staticReports: Report[] = [
    {
      id: '1',
      reporter_email: 'user1@example.com',
      reported_user_email: 'user2@example.com',
      report_type: 'spam',
      description: '该用户发送垃圾信息',
      status: 'pending',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      reporter_email: 'user3@example.com',
      reported_user_email: 'user4@example.com',
      report_type: 'harassment',
      description: '该用户发送骚扰信息',
      status: 'resolved',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      resolved_at: new Date(Date.now() - 43200000).toISOString(),
      resolution_notes: '已警告用户'
    },
    {
      id: '3',
      reporter_email: 'user5@example.com',
      reported_user_email: 'user6@example.com',
      report_type: 'inappropriate',
      description: '该用户发布不当内容',
      status: 'dismissed',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      resolved_at: new Date(Date.now() - 129600000).toISOString(),
      resolution_notes: '内容未违反规定'
    }
  ];

  useEffect(() => {
    // 模拟加载延迟
    const timer = setTimeout(() => {
      setReports(staticReports);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const filteredReports = reports.filter(report => {
    if (filterStatus !== 'all' && report.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        report.reporter_email?.toLowerCase().includes(query) ||
        report.reported_user_email?.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query) ||
        report.report_type.toLowerCase().includes(query)
      );
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

  function getReportTypeBadge(type: string) {
    switch (type) {
      case 'spam':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">垃圾信息</span>;
      case 'harassment':
        return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">骚扰</span>;
      case 'inappropriate':
        return <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">不当内容</span>;
      case 'other':
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">其他</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{type}</span>;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">待处理</span>;
      case 'resolved':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">已处理</span>;
      case 'dismissed':
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">已驳回</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{status}</span>;
    }
  }

  async function handleResolveReport(reportId: string, resolve: boolean) {
    try {
      const status = resolve ? 'resolved' : 'dismissed';
      const response = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: reportId,
          status,
          resolutionNotes: resolutionNotes || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`操作失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.ok) {
        // 重新加载举报列表
        loadReports();
        setSelectedReport(null);
        setResolutionNotes('');
      } else {
        console.error('处理举报失败:', result.error);
      }
    } catch (error) {
      console.error('处理举报失败:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">举报管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            处理用户举报内容
          </p>
        </div>
        <Button variant="outline" onClick={loadReports} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="搜索举报人、被举报人或内容..."
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
            <SelectItem value="pending">待处理</SelectItem>
            <SelectItem value="resolved">已处理</SelectItem>
            <SelectItem value="dismissed">已驳回</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>举报记录</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              暂无举报记录
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3 px-4">举报类型</th>
                    <th className="text-left py-3 px-4">举报人</th>
                    <th className="text-left py-3 px-4">被举报人</th>
                    <th className="text-left py-3 px-4">描述</th>
                    <th className="text-left py-3 px-4">状态</th>
                    <th className="text-left py-3 px-4">举报时间</th>
                    <th className="text-left py-3 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{getReportTypeBadge(report.report_type)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{report.reporter_email || report.reporterId}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <UserX className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{report.reported_user_email || report.reportedUserId}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate">{report.description}</td>
                      <td className="py-3 px-4">{getStatusBadge(report.status)}</td>
                      <td className="py-3 px-4">{formatDate(report.created_at)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedReport(report)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {report.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setResolutionNotes('');
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setResolutionNotes('');
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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

      {/* 详情/处理对话框 */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                举报详情
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">举报人</h3>
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {selectedReport.reporter_email || selectedReport.reporter_user_id}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">被举报人</h3>
                  <p className="flex items-center gap-2">
                    <UserX className="h-4 w-4" />
                    {selectedReport.reported_user_email || selectedReport.reported_user_id}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">举报类型</h3>
                  <p>{getReportTypeBadge(selectedReport.report_type)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">状态</h3>
                  <p>{getStatusBadge(selectedReport.status)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">举报时间</h3>
                  <p>{formatDate(selectedReport.createdAt)}</p>
                </div>
                {selectedReport.resolved_at && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">处理时间</h3>
                    <p>{formatDate(selectedReport.resolved_at)}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">举报描述</h3>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="whitespace-pre-wrap">{selectedReport.description}</p>
                  </CardContent>
                </Card>
              </div>

              {selectedReport.resolution_notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">处理说明</h3>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <p className="whitespace-pre-wrap">{selectedReport.resolution_notes}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedReport.status === 'pending' && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">处理说明</h3>
                  <Textarea
                    placeholder="请输入处理说明..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={() => setSelectedReport(null)}>
                      取消
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleResolveReport(selectedReport.id, false)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      驳回
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleResolveReport(selectedReport.id, true)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      标记为已处理
                    </Button>
                  </div>
                </div>
              )}

              {selectedReport.status !== 'pending' && (
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setSelectedReport(null)}>
                    关闭
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}