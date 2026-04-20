# 视频文件放置说明

1. 将您的视频文件（MP4格式）命名为 `demo.mp4` 放置在此目录下
2. 或者修改 `app/page.tsx` 中的视频源路径：
   ```jsx
   <source src="/videos/您的视频文件名.mp4" type="video/mp4" />
   ```
3. 支持的视频格式：MP4、WebM、Ogg
4. 视频文件大小建议不超过 50MB 以保证加载速度

如果您没有视频文件，可以在此处下载一个示例视频：
- [示例视频](https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4) (1MB MP4)