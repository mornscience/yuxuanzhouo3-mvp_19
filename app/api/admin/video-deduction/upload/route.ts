import { NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/admin/session";
import { dbAdapter } from "@/lib/market/db-adapter";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string || 'Untitled Video';

    if (!file) {
      return Response.json(
        { ok: false, message: 'No file uploaded' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fileBuffer = await file.arrayBuffer();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    const filePath = `videos/${fileName}`;

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('videos')
      .upload(filePath, Buffer.from(fileBuffer), {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('[Video Upload] Failed to upload:', uploadError);
      return Response.json(
        { ok: false, message: uploadError.message || 'Failed to upload video' },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(filePath);
    const videoUrl = urlData.publicUrl;

    const videoData = {
      title,
      video_url: videoUrl,
      file_path: filePath,
      is_active: true,
      file_size: file.size,
      duration: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const result = await dbAdapter.createRow('video_deduction', videoData);

    if (!result) {
      return Response.json(
        { ok: false, message: 'Failed to save video record' },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      message: 'Video uploaded successfully',
      data: {
        id: result.id,
        title,
        video_url: videoUrl,
        file_size: file.size
      }
    });

  } catch (error: any) {
    console.error('[Video Upload API] Error:', error);
    return Response.json(
      { ok: false, message: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}