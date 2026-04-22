-- 创建 apks 存储桶
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'apks') THEN 
        INSERT INTO storage.buckets (id, name, public) 
        VALUES ('apks', 'apks', true); 
    END IF; 
END $$;

-- 所有人可下载 APK
CREATE POLICY IF NOT EXISTS "Public can download apks" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'apks');

-- 登录用户可上传 APK
CREATE POLICY IF NOT EXISTS "Authenticated can upload apks" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'apks');

-- 登录用户可修改/删除 APK
CREATE POLICY IF NOT EXISTS "Authenticated can update apks" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'apks');

CREATE POLICY IF NOT EXISTS "Authenticated can delete apks" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'apks');
