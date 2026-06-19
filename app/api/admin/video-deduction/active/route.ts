import { NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/admin/session";
import { dbAdapter } from "@/lib/market/db-adapter";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const status = params.get('status');
    const search = params.get('search');

    let filters: any = {};
    if (status && status !== 'all') {
      if (status === 'active') {
        filters.is_active = true;
      } else if (status === 'inactive') {
        filters.is_active = false;
      }
    }
    
    const data = await dbAdapter.loadRows('video_deduction', filters);
    
    let results = (data || []).map((item: any) => ({
      id: item.id,
      video_url: item.video_url,
      video_name: item.title || '未命名视频',
      status: item.is_active ? 'active' : 'inactive',
      created_at: item.created_at,
      updated_at: item.updated_at,
      file_size: item.file_size || 0,
      duration: item.duration || 0
    }));
    
    if (search) {
      const query = search.toLowerCase();
      results = results.filter(item => 
        item.video_name?.toLowerCase().includes(query)
      );
    }

    return Response.json({
      ok: true,
      data: results
    });

  } catch (error: any) {
    console.error('[Video Deduction API] Failed to get list:', error);
    return Response.json(
      { ok: false, message: error.message || 'Failed to get list' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const body = await request.json();
    
    const { id, status } = body;
    
    if (!id || !status) {
      return Response.json(
        { ok: false, message: '缺少参数' },
        { status: 400 }
      );
    }

    const result = await dbAdapter.updateRow('video_deduction', id, {
      is_active: status === 'active',
      updated_at: new Date().toISOString()
    });

    if (result) {
      return Response.json({
        ok: true,
        message: '状态更新成功'
      });
    } else {
      return Response.json(
        { ok: false, message: '更新失败' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[Video Deduction API] Failed to update status:', error);
    return Response.json(
      { ok: false, message: error.message || '更新失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdminSession();
    const body = await request.json();
    
    const { id } = body;
    
    if (!id) {
      return Response.json(
        { ok: false, message: '缺少视频ID' },
        { status: 400 }
      );
    }

    const result = await dbAdapter.deleteRow('video_deduction', id);

    if (result) {
      return Response.json({
        ok: true,
        message: '视频删除成功'
      });
    } else {
      return Response.json(
        { ok: false, message: '删除失败' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[Video Deduction API] Failed to delete:', error);
    return Response.json(
      { ok: false, message: error.message || '删除失败' },
      { status: 500 }
    );
  }
}