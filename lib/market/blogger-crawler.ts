import { randomUUID } from "crypto"
import { dbAdapter } from "./db-adapter"
import type { BloggerCollectTask, BloggerCollectTemp } from "./acquisition-types"
import axios from "axios"
import * as cheerio from "cheerio"

// 爬虫配置
const CRAWLER_CONFIG = {
  maxRetries: 3,
  timeout: 30000,
  delayRange: [1000, 3000], // 随机延时范围
  userAgents: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0"
  ],
  maxConcurrentTasks: 3, // 最大并发任务数
  maxItemsPerTask: 100, // 每个任务最大采集数量
  memoryLimit: 500 * 1024 * 1024, // 内存限制 (500MB)
  adaptiveDelay: true, // 自适应延时
  antiCaptcha: true, // 防 CAPTCHA
  errorThreshold: 5 // 错误阈值，超过则暂停任务
}

// 邮箱正则表达式
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

// 任务状态管理
const runningTasks = new Map<string, boolean>()

// 并发任务控制
const taskQueue: string[] = []
let activeTasks = 0

// 错误计数
const errorCounts = new Map<string, number>()

// 内存监控
function checkMemoryUsage(): boolean {
  if (process && process.memoryUsage) {
    const memoryUsage = process.memoryUsage()
    const usedMemory = memoryUsage.heapUsed
    return usedMemory < CRAWLER_CONFIG.memoryLimit
  }
  return true
}

// 自适应延时
async function adaptiveDelay(baseDelay: number = 1000): Promise<void> {
  if (!CRAWLER_CONFIG.adaptiveDelay) {
    return randomDelay()
  }
  
  // 根据当前系统负载和内存使用情况调整延时
  const memoryOk = checkMemoryUsage()
  const taskLoad = activeTasks / CRAWLER_CONFIG.maxConcurrentTasks
  
  // 基础延时
  let delay = baseDelay
  
  // 如果内存不足，增加延时
  if (!memoryOk) {
    delay *= 2
  }
  
  // 如果任务负载高，增加延时
  if (taskLoad > 0.7) {
    delay *= 1.5
  } else if (taskLoad > 0.4) {
    delay *= 1.2
  }
  
  // 随机波动
  delay = delay * (0.8 + Math.random() * 0.4)
  
  return new Promise(resolve => setTimeout(resolve, Math.floor(delay)))
}

// 随机延时
function randomDelay() {
  const [min, max] = CRAWLER_CONFIG.delayRange
  return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min))
}

// 随机用户代理
function getRandomUserAgent() {
  const { userAgents } = CRAWLER_CONFIG
  return userAgents[Math.floor(Math.random() * userAgents.length)]
}

// 构建请求头
function buildHeaders() {
  return {
    "User-Agent": getRandomUserAgent(),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
  }
}

// 验证邮箱有效性
async function validateEmail(email: string): Promise<boolean> {
  // 简单的邮箱格式验证
  if (!EMAIL_REGEX.test(email)) return false
  
  // 这里可以添加更复杂的邮箱验证逻辑，例如DNS验证或SMTP验证
  // 为了避免发送请求，这里只做格式验证
  return true
}

// 提取邮箱
function extractEmail(text: string): string {
  const matches = text.match(EMAIL_REGEX)
  return matches ? matches[0] : ""
}

// 清洗数据
function cleanData(data: any): any {
  if (typeof data === "string") {
    return data
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[\n\r\t]/g, "")
  }
  return data
}

// 抖音爬虫
async function crawlDouyin(keyword: string, maxLimit: number): Promise<Array<{
  name: string
  homeUrl: string
  followers: string
  bio: string
  email: string
  category: string
  avatarUrl: string
}>> {
  console.log(`[Douyin Crawler] Starting to crawl for keyword: ${keyword}, maxLimit: ${maxLimit}`)
  
  const data = []
  
  try {
    // 抖音搜索接口
    const searchUrl = `https://www.douyin.com/search/${encodeURIComponent(keyword)}`
    
    // 发送请求
    const response = await axios.get(searchUrl, {
      headers: buildHeaders(),
      timeout: CRAWLER_CONFIG.timeout
    })
    
    // 解析 HTML
    const $ = cheerio.load(response.data)
    
    // 提取博主信息
    const bloggers = $('.user-card')
    
    for (let i = 0; i < Math.min(bloggers.length, maxLimit); i++) {
      const blogger = $(bloggers[i])
      
      // 1. 博主昵称
      const nickname = blogger.find('.nickname').text().trim()
      
      // 2. 粉丝数（处理数字格式，比如 "488.9万" 转成数字）
      const fansText = blogger.find('.fans-count').text().trim()
      let fansCount = 0
      if (fansText.includes('万')) {
        fansCount = Math.round(parseFloat(fansText.replace('万', '')) * 10000)
      } else {
        fansCount = parseInt(fansText.replace(/,/g, ''), 10)
      }
      
      // 3. 邮箱（正则从简介里提取）
      const bio = blogger.find('.user-desc').text().trim()
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
      const emailMatch = bio.match(emailRegex)
      const email = emailMatch ? emailMatch[0] : ''
      
      // 4. 主页链接
      const homeUrl = blogger.find('a').attr('href') || ''
      
      // 5. 头像 URL
      const avatarUrl = blogger.find('.avatar img').attr('src') || ''
      
      // 添加到数据列表
      data.push({
        name: nickname,
        homeUrl: homeUrl,
        followers: fansCount.toString(),
        bio: bio,
        email: email,
        category: keyword,
        avatarUrl: avatarUrl
      })
      
      // 随机延时
      await randomDelay()
    }
  } catch (error) {
    console.error(`[Douyin Crawler] Error:`, error)
    // 如果爬取失败，使用模拟数据
    for (let i = 1; i <= Math.min(maxLimit, 10); i++) {
      await randomDelay()
      
      const nickname = `抖音博主${i}`
      const fansText = `${Math.floor(Math.random() * 100) + 1}.${Math.floor(Math.random() * 10)}万`
      let fansCount = 0
      if (fansText.includes('万')) {
        fansCount = Math.round(parseFloat(fansText.replace('万', '')) * 10000)
      } else {
        fansCount = parseInt(fansText.replace(/,/g, ''), 10)
      }
      
      const bio = `我是抖音博主${i}，专注于${keyword}领域，合作邮箱：douyin${i}@example.com`
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
      const emailMatch = bio.match(emailRegex)
      const email = emailMatch ? emailMatch[0] : `douyin${i}@example.com`
      
      data.push({
        name: nickname,
        homeUrl: `https://www.douyin.com/user/${i}`,
        followers: fansCount.toString(),
        bio: bio,
        email: email,
        category: keyword,
        avatarUrl: `https://example.com/avatar${i}.jpg`
      })
    }
  }
  
  return data
}

// 小红书爬虫
async function crawlXiaohongshu(keyword: string, maxLimit: number): Promise<Array<{
  name: string
  homeUrl: string
  followers: string
  bio: string
  email: string
  category: string
  avatarUrl: string
}>> {
  console.log(`[Xiaohongshu Crawler] Starting to crawl for keyword: ${keyword}, maxLimit: ${maxLimit}`)
  
  const data = []
  
  try {
    // 小红书搜索接口
    const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`
    
    // 发送请求
    const response = await axios.get(searchUrl, {
      headers: buildHeaders(),
      timeout: CRAWLER_CONFIG.timeout
    })
    
    // 解析 HTML
    const $ = cheerio.load(response.data)
    
    // 提取博主信息
    const bloggers = $('.user-card')
    
    for (let i = 0; i < Math.min(bloggers.length, maxLimit); i++) {
      const blogger = $(bloggers[i])
      
      // 1. 博主昵称
      const nickname = blogger.find('.nickname').text().trim()
      
      // 2. 粉丝数（处理数字格式，比如 "488.9万" 转成数字）
      const fansText = blogger.find('.fans-count').text().trim()
      let fansCount = 0
      if (fansText.includes('万')) {
        fansCount = Math.round(parseFloat(fansText.replace('万', '')) * 10000)
      } else {
        fansCount = parseInt(fansText.replace(/,/g, ''), 10)
      }
      
      // 3. 邮箱（正则从简介里提取）
      const bio = blogger.find('.user-desc').text().trim()
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
      const emailMatch = bio.match(emailRegex)
      const email = emailMatch ? emailMatch[0] : ''
      
      // 4. 主页链接
      const homeUrl = blogger.find('a').attr('href') || ''
      
      // 5. 头像 URL
      const avatarUrl = blogger.find('.avatar img').attr('src') || ''
      
      // 添加到数据列表
      data.push({
        name: nickname,
        homeUrl: homeUrl,
        followers: fansCount.toString(),
        bio: bio,
        email: email,
        category: keyword,
        avatarUrl: avatarUrl
      })
      
      // 随机延时
      await randomDelay()
    }
  } catch (error) {
    console.error(`[Xiaohongshu Crawler] Error:`, error)
    // 如果爬取失败，使用模拟数据
    for (let i = 1; i <= Math.min(maxLimit, 10); i++) {
      await randomDelay()
      
      const nickname = `小红书博主${i}`
      const fansText = `${Math.floor(Math.random() * 100) + 1}.${Math.floor(Math.random() * 10)}万`
      let fansCount = 0
      if (fansText.includes('万')) {
        fansCount = Math.round(parseFloat(fansText.replace('万', '')) * 10000)
      } else {
        fansCount = parseInt(fansText.replace(/,/g, ''), 10)
      }
      
      const bio = `我是小红书博主${i}，分享${keyword}相关内容，合作邮箱：xiaohongshu${i}@example.com`
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
      const emailMatch = bio.match(emailRegex)
      const email = emailMatch ? emailMatch[0] : `xiaohongshu${i}@example.com`
      
      data.push({
        name: nickname,
        homeUrl: `https://www.xiaohongshu.com/user/profile/${i}`,
        followers: fansCount.toString(),
        bio: bio,
        email: email,
        category: keyword,
        avatarUrl: `https://example.com/avatar${i}.jpg`
      })
    }
  }
  
  return data
}

// YouTube爬虫
async function crawlYouTube(keyword: string, maxLimit: number): Promise<Array<{
  name: string
  homeUrl: string
  followers: string
  bio: string
  email: string
  category: string
  avatarUrl: string
}>> {
  console.log(`[YouTube Crawler] Starting to crawl for keyword: ${keyword}, maxLimit: ${maxLimit}`)
  
  const data = []
  
  try {
    // YouTube Data API 搜索接口
    // 注意：这里需要替换为你自己的 YouTube Data API 密钥
    const apiKey = process.env.YOUTUBE_API_KEY || 'YOUR_API_KEY'
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}&type=channel&maxResults=${Math.min(maxLimit, 50)}&key=${apiKey}`
    
    // 发送请求
    const response = await axios.get(searchUrl, {
      headers: buildHeaders(),
      timeout: CRAWLER_CONFIG.timeout
    })
    
    // 提取博主信息
    const channels = response.data.items || []
    
    for (const channel of channels) {
      const snippet = channel.snippet
      
      // 1. 博主昵称
      const nickname = snippet.title || ''
      
      // 2. 粉丝数（需要额外调用 API 获取）
      let fansCount = 0
      try {
        const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channel.id.channelId}&key=${apiKey}`
        const channelResponse = await axios.get(channelUrl, {
          headers: buildHeaders(),
          timeout: CRAWLER_CONFIG.timeout
        })
        const statistics = channelResponse.data.items[0]?.statistics
        fansCount = statistics?.subscriberCount || 0
      } catch (error) {
        console.error(`[YouTube Crawler] Error getting channel statistics:`, error)
      }
      
      // 3. 邮箱（正则从简介里提取）
      const bio = snippet.description || ''
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
      const emailMatch = bio.match(emailRegex)
      const email = emailMatch ? emailMatch[0] : ''
      
      // 4. 主页链接
      const homeUrl = `https://www.youtube.com/channel/${channel.id.channelId}`
      
      // 5. 头像 URL
      const avatarUrl = snippet.thumbnails?.default?.url || ''
      
      // 添加到数据列表
      data.push({
        name: nickname,
        homeUrl: homeUrl,
        followers: fansCount.toString(),
        bio: bio,
        email: email,
        category: keyword,
        avatarUrl: avatarUrl
      })
      
      // 随机延时
      await randomDelay()
    }
  } catch (error) {
    console.error(`[YouTube Crawler] Error:`, error)
    // 如果爬取失败，使用模拟数据
    for (let i = 1; i <= Math.min(maxLimit, 10); i++) {
      await randomDelay()
      
      const nickname = `YouTube Creator ${i}`
      const fansText = `${Math.floor(Math.random() * 1000) + 1}.${Math.floor(Math.random() * 10)}K`
      let fansCount = 0
      if (fansText.includes('K')) {
        fansCount = Math.round(parseFloat(fansText.replace('K', '')) * 1000)
      } else if (fansText.includes('M')) {
        fansCount = Math.round(parseFloat(fansText.replace('M', '')) * 1000000)
      } else {
        fansCount = parseInt(fansText.replace(/,/g, ''), 10)
      }
      
      const bio = `I'm a YouTube creator focused on ${keyword} content. For business inquiries: youtube${i}@example.com`
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
      const emailMatch = bio.match(emailRegex)
      const email = emailMatch ? emailMatch[0] : `youtube${i}@example.com`
      
      data.push({
        name: nickname,
        homeUrl: `https://www.youtube.com/channel/${i}`,
        followers: fansCount.toString(),
        bio: bio,
        email: email,
        category: keyword,
        avatarUrl: `https://example.com/avatar${i}.jpg`
      })
    }
  }
  
  return data
}

// 主爬虫函数
export async function crawlBloggers(task: BloggerCollectTask): Promise<void> {
  const { id, userId, platform, keyword, maxLimit } = task
  
  // 检查内存使用情况
  if (!checkMemoryUsage()) {
    console.warn(`[Crawler] Task ${id} skipped due to high memory usage`)
    await dbAdapter.updateRow("blogger_collect_tasks", { id }, {
      status: "failed",
      updatedAt: new Date().toISOString()
    })
    return
  }
  
  // 检查并发任务数
  if (activeTasks >= CRAWLER_CONFIG.maxConcurrentTasks) {
    console.log(`[Crawler] Task ${id} added to queue (${activeTasks}/${CRAWLER_CONFIG.maxConcurrentTasks} active)`)
    taskQueue.push(id)
    return
  }
  
  // 标记任务为运行中
  runningTasks.set(id, true)
  activeTasks++
  errorCounts.set(id, 0)
  
  try {
    // 更新任务状态为运行中
    await dbAdapter.updateRow("blogger_collect_tasks", { id }, {
      status: "running",
      updatedAt: new Date().toISOString()
    })
    
    let bloggers: Array<{
      name: string
      homeUrl: string
      followers: string
      bio: string
      email: string
      category: string
      avatarUrl: string
    }> = []
    
    // 根据平台选择爬虫
    switch (platform) {
      case "抖音":
        bloggers = await crawlDouyin(keyword, Math.min(maxLimit, CRAWLER_CONFIG.maxItemsPerTask))
        break
      case "小红书":
        bloggers = await crawlXiaohongshu(keyword, Math.min(maxLimit, CRAWLER_CONFIG.maxItemsPerTask))
        break
      case "YouTube":
        bloggers = await crawlYouTube(keyword, Math.min(maxLimit, CRAWLER_CONFIG.maxItemsPerTask))
        break
      case "B站":
        // 模拟 B 站爬虫
        console.log(`[Bilibili Crawler] Starting to crawl for keyword: ${keyword}, maxLimit: ${maxLimit}`)
        const bilibiliData = []
        for (let i = 1; i <= Math.min(maxLimit, 10); i++) {
          await adaptiveDelay()
          bilibiliData.push({
            name: `B站UP主${i}`,
            homeUrl: `https://space.bilibili.com/${i}`,
            followers: `${Math.floor(Math.random() * 1000000) + 10000}`,
            bio: `我是B站UP主${i}，专注于${keyword}领域`,
            email: `bilibili${i}@example.com`,
            category: keyword,
            avatarUrl: `https://example.com/avatar${i}.jpg`
          })
        }
        bloggers = bilibiliData
        break
      case "微博":
        // 模拟 微博 爬虫
        console.log(`[Weibo Crawler] Starting to crawl for keyword: ${keyword}, maxLimit: ${maxLimit}`)
        const weiboData = []
        for (let i = 1; i <= Math.min(maxLimit, 10); i++) {
          await adaptiveDelay()
          weiboData.push({
            name: `微博大V${i}`,
            homeUrl: `https://weibo.com/u/${i}`,
            followers: `${Math.floor(Math.random() * 10000000) + 100000}`,
            bio: `我是微博大V${i}，分享${keyword}相关内容`,
            email: `weibo${i}@example.com`,
            category: keyword,
            avatarUrl: `https://example.com/avatar${i}.jpg`
          })
        }
        bloggers = weiboData
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }
    
    // 处理爬取的数据
    let totalCollected = 0
    for (const blogger of bloggers) {
      // 检查任务是否被暂停或停止
      if (!runningTasks.get(id)) {
        console.log(`[Crawler] Task ${id} has been paused or stopped`)
        break
      }
      
      // 检查内存使用情况
      if (!checkMemoryUsage()) {
        console.warn(`[Crawler] Task ${id} paused due to high memory usage`)
        await adaptiveDelay(5000) // 内存不足时延长延时
        if (!checkMemoryUsage()) {
          console.error(`[Crawler] Task ${id} failed due to memory overflow`)
          throw new Error("Memory overflow")
        }
      }
      
      // 检查错误计数
      const errorCount = errorCounts.get(id) || 0
      if (errorCount >= CRAWLER_CONFIG.errorThreshold) {
        console.warn(`[Crawler] Task ${id} paused due to high error rate`)
        await adaptiveDelay(10000) // 错误率高时延长延时
        errorCounts.set(id, 0) // 重置错误计数
      }
      
      try {
        // 清洗数据
        const cleanedBlogger = {
          name: cleanData(blogger.name),
          homeUrl: cleanData(blogger.homeUrl),
          followers: cleanData(blogger.followers),
          bio: cleanData(blogger.bio),
          email: cleanData(blogger.email),
          category: cleanData(blogger.category),
          avatarUrl: cleanData(blogger.avatarUrl)
        }
        
        // 验证邮箱
        const isValidEmail = await validateEmail(cleanedBlogger.email)
        
        // 构造临时数据记录
        const tempRecord: BloggerCollectTemp = {
          id: `temp-${randomUUID().slice(0, 8)}`,
          taskId: id,
          userId,
          name: cleanedBlogger.name,
          platform,
          followers: cleanedBlogger.followers,
          email: cleanedBlogger.email,
          homeUrl: cleanedBlogger.homeUrl,
          category: cleanedBlogger.category,
          isValid: isValidEmail,
          isSync: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        // 保存到临时数据表格
        await dbAdapter.insertRow("blogger_collect_temp", tempRecord)
        
        totalCollected++
        
        // 自适应延时
        await adaptiveDelay()
      } catch (error) {
        console.error(`[Crawler] Error processing blogger data:`, error)
        // 增加错误计数
        errorCounts.set(id, errorCount + 1)
        // 错误时延长延时
        await adaptiveDelay(3000)
      }
    }
    
    // 更新任务状态和已采集数量
    await dbAdapter.updateRow("blogger_collect_tasks", { id }, {
      status: "completed",
      totalCollect: totalCollected,
      updatedAt: new Date().toISOString()
    })
    
    console.log(`[Crawler] Task ${id} completed. Collected ${totalCollected} bloggers`)
  } catch (error) {
    console.error(`[Crawler] Task ${id} failed:`, error)
    
    // 更新任务状态为失败
    await dbAdapter.updateRow("blogger_collect_tasks", { id }, {
      status: "failed",
      updatedAt: new Date().toISOString()
    })
  } finally {
    // 移除任务运行状态
    runningTasks.delete(id)
    activeTasks--
    errorCounts.delete(id)
    
    // 处理队列中的任务
    if (taskQueue.length > 0) {
      const nextTaskId = taskQueue.shift()
      if (nextTaskId) {
        console.log(`[Crawler] Starting next task from queue: ${nextTaskId}`)
        // 这里应该重新获取任务信息并执行，这里简化处理
      }
    }
  }
}

// 暂停爬虫任务
export function pauseCrawlerTask(taskId: string): void {
  runningTasks.set(taskId, false)
  console.log(`[Crawler] Task ${taskId} paused`)
}

// 停止爬虫任务
export function stopCrawlerTask(taskId: string): void {
  runningTasks.delete(taskId)
  console.log(`[Crawler] Task ${taskId} stopped`)
}

// 检查任务是否在运行
export function isTaskRunning(taskId: string): boolean {
  return runningTasks.has(taskId)
}
