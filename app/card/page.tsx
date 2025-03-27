'use client';
 
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface PreviewData {
  content: string;
}

const CARD_SYSTEM_PROMPT = 
`
## 任务
我会给你一段内容，请你分析内容，并将其转化为美观漂亮的中文可视化网页：

## 内容输出要求
- 所有页面内容必须为简体中文
- 保持原文件的核心信息，但以更易读、可视化的方式呈现


## 设计风格
- 整体风格参考Linear App的简约现代设计
- 使用清晰的视觉层次结构，突出重要内容
- 配色方案应专业、和谐，适合长时间阅读

## 技术规范
- 使用HTML5、TailwindCSS 3.0+（通过CDN引入）和必要的JavaScript
- 实现完整的深色/浅色模式切换功能，默认跟随系统设置
- 代码结构清晰，包含适当注释，便于理解和维护

## 响应式设计
- 页面必须在所有设备上（手机、平板、桌面）完美展示
- 针对不同屏幕尺寸优化布局和字体大小
- 确保移动端有良好的触控体验

## 图标与视觉元素
- 使用专业图标库如Font Awesome或Material Icons（通过CDN引入）
- 根据内容主题选择合适的插图或图表展示数据
- 避免使用emoji作为主要图标

## 交互体验
- 添加适当的微交互效果提升用户体验：
  * 按钮悬停时有轻微放大和颜色变化
  * 卡片元素悬停时有精致的阴影和边框效果
  * 页面滚动时有平滑过渡效果
  * 内容区块加载时有优雅的淡入动画

## 性能优化
- 确保页面加载速度快，避免不必要的大型资源
- 图片使用现代格式(WebP)并进行适当压缩
- 实现懒加载技术用于长页面内容

## 输出要求
- 提供完整可运行的单一HTML文件，包含所有必要的CSS和JavaScript
- 确保代码符合W3C标准，无错误警告
- 页面在不同浏览器中保持一致的外观和功能

## 限制
只输出html代码，不输出任何其他内容

请根据上传文件的内容类型（文档、数据、图片等），创建最适合展示该内容的可视化网页。`;
 
export default function CardPage() {
  const [previewContent, setPreviewContent] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamContent, setStreamContent] = useState<string>('');
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 创建 Blob URL 用于 iframe 预览
  const createPreviewUrl = (htmlContent: string) => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return URL.createObjectURL(blob);
  };

  // 清理 Blob URL
  const cleanupPreviewUrl = (url: string) => {
    URL.revokeObjectURL(url);
  };

  // 提取HTML内容
  const extractHtmlContent = (content: string) => {
    // 检查是否包含代码块
    const codeBlockMatch = content.match(/```(?:html)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      // 提取代码块内容并返回
      const htmlContent = codeBlockMatch[1].trim();
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
    }

    // 尝试直接匹配HTML标签结构
    const htmlMatch = content.match(/<html[\s\S]*?<\/html>/i) || 
                     content.match(/<body[\s\S]*?<\/body>/i) ||
                     content.match(/<div[\s\S]*?<\/div>/i);
    
    if (htmlMatch) {
      // 如果找到了HTML标签结构，返回一个包装好的HTML文档
      const htmlContent = htmlMatch[0];
      if (htmlContent.match(/<html/i)) {
        // 如果已经是完整的HTML文档，直接返回
        return htmlContent;
      } else {
        // 如果只是body或div标签，包装成HTML文档
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
      }
    }

    // 如果所有方法都失败，返回一个默认的HTML文档
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <div style="padding: 20px; font-family: system-ui, sans-serif;">
    <h3>未找到有效的HTML内容</h3>
    <p>AI生成的内容中没有包含有效的HTML代码。</p>
  </div>
</body>
</html>`;
  };

  // 更新 iframe 内容
  const updateIframePreview = (content: string) => {
    if (iframeRef.current) {
      const htmlContent = extractHtmlContent(content);
      const previewUrl = createPreviewUrl(htmlContent);
      iframeRef.current.src = previewUrl;
      
      // 清理旧的 Blob URL
      return () => cleanupPreviewUrl(previewUrl);
    }
  };

  // 监听内容变化，更新预览
  useEffect(() => {
    if (showHtmlPreview && streamContent) {
      // 直接在 iframe 上使用 srcDoc 设置内容，不需要额外调用 updateIframePreview
      // 由于我们在 JSX 中已经使用了 extractHtmlContent，这里不需要额外的逻辑
    }
  }, [streamContent, showHtmlPreview]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setStreamContent('');
    setPreviewContent(null);

    try {
      const formData = new FormData(e.currentTarget);
      const content = formData.get('content') as string;

      const response = await fetch('/api/HS_ds0325', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: CARD_SYSTEM_PROMPT },
            { role: 'user', content: content }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate card');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // 更新预览内容
              setStreamContent(fullContent);
              setPreviewContent({
                content: fullContent
              });
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setStreamContent(fullContent);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : '生成失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 添加生成图片的函数
  const generateImage = async () => {
    if (!iframeRef.current) return;

    try {
      // 获取 iframe 中的内容
      const iframe = iframeRef.current;
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!iframeDocument || !iframeDocument.body) {
        setError('无法访问iframe内容，请检查预览是否正确加载');
        return;
      }

      // 动态加载 html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      // 生成图片
      const canvas = await html2canvas(iframeDocument.body, {
        useCORS: true,
        scale: 2, // 提高图片质量
        backgroundColor: null,
        logging: false,
        allowTaint: true,
        foreignObjectRendering: true,
        width: iframeDocument.body.scrollWidth,
        height: iframeDocument.body.scrollHeight,
      });

      // 转换为图片并下载
      const link = document.createElement('a');
      link.download = `card-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
      setError('生成图片失败，请确保预览内容已完全加载');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header & Navigation */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-sm shadow-sm z-50">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-gray-600 transition-colors">
            WebShaper
          </Link>
          <div className="flex gap-4">
            <Link href="/card" className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
              卡片设计
            </Link>
            <Link href="/cover" className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
              封面设计
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold text-center mb-6 text-gray-800">
            一键生成精美网页信息卡片
          </h1>
          <p className="text-center text-gray-600 mb-8">
            创建并分享你的精美卡片，展示你的创意和想法
          </p>
          
          {/* Form Section */}
          <section className="max-w-[1080px] mx-auto px-4 py-8">
            <form onSubmit={handleSubmit} className="mb-12">
              <div className="relative">
                <textarea
                  name="content"
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="输入你的内容..."
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="absolute right-4 bottom-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? '生成中...' : '发送'}
                </button>
              </div>
            </form>
          </section>

          {/* Preview Section */}
          <div className="max-w-[1280px] mx-auto px-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">预览区域</h2>
                {streamContent && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {showHtmlPreview ? '显示代码' : '预览HTML'}
                    </button>
                    {showHtmlPreview && (
                      <>
                        <button
                          onClick={() => {
                            if (iframeRef.current) {
                              iframeRef.current.contentWindow?.location.reload();
                            }
                          }}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          刷新预览
                        </button>
                        <button
                          onClick={generateImage}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          保存为PNG
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {error ? (
                <p className="text-red-500">{error}</p>
              ) : showHtmlPreview ? (
                <div className="w-full h-[1280px] border border-gray-200 rounded-lg">
                  <iframe
                    ref={iframeRef}
                    srcDoc={extractHtmlContent(streamContent)}
                    className="w-full h-full"
                    style={{ border: 'none', backgroundColor: 'white' }}
                    sandbox="allow-same-origin allow-scripts"
                  />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg overflow-auto max-h-[600px]">
                  {streamContent || '预览内容将在这里显示...'}
                </pre>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>创意来源：归藏 & 向阳乔木 卡片生成提示词</p>
            <p className="mt-2">© 2025 CT creation. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
} 