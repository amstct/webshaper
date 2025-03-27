'use client';
 
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface CoverData {
  style: string;
  coverText: string;
  accountName: string;
  slogan: string;
  content: string;
}

interface CoverResult {
  timestamp: string;
  style: string;
  coverText: string;
  accountName: string;
  slogan?: string;
  content: string;
}

const COVER_SYSTEM_PROMPT = 
`# 小红书封面生成提示词

你是一位优秀的网页和营销视觉设计师，具备丰富的UI/UX设计经验，曾为众多知名品牌打造过吸睛的营销视觉，擅长融合现代设计趋势与实用营销策略。现需为我创建一张专业级小红书封面，使用HTML、CSS和JavaScript代码实现以下要求：

## 基本要求
1. **尺寸与基础结构**
    - 比例严格为3:4（宽:高）。
    - 设计一个边框为0的div作为画布，保证生成图片无边界。
    - 最外面的卡片为直角。
    - 将提供的文案提炼为30-40字以内的中文精华内容。
    - 文字成为视觉主体，占据页面至少70%的空间。
    - 运用3-4种不同字号营造层次感，关键词用最大字号。
    - 主标题字号比副标题和介绍大三倍以上。
    - 主标题提取2-3个关键词，进行特殊处理（如描边、高亮、不同颜色）。
2. **技术实现**
    - 采用现代CSS技术（如flex/grid布局、变量、渐变）。
    - 代码简洁高效，无冗余元素。
    - 添加一个不影响设计的保存按钮。
    - 用html2canvas实现一键保存为图片功能。
    - 保存的图片仅含封面设计，不含界面元素。
    - 使用Google Fonts或其他CDN加载合适的现代字体。
    - 可引用在线图标资源（如Font Awesome）。
3. **专业排版技巧**
    - 运用"反白空间"技巧创造焦点。
    - 文字与装饰元素保持和谐比例关系。
    - 确保视觉流向清晰，引导读者目光移动。
    - 使用微妙的阴影或光效增加层次感。



    `;
 
export default function CoverPage() {
  const [previewContent, setPreviewContent] = useState<CoverData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamContent, setStreamContent] = useState<string>('');
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [styleOptions, setStyleOptions] = useState<Array<{value: string, label: string}>>([]);
  const [selectedStylePrompt, setSelectedStylePrompt] = useState<string>('');
  const [coverResults, setCoverResults] = useState<CoverResult[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 加载风格选项
  useEffect(() => {
    const loadStyleOptions = async () => {
      try {
        const response = await fetch('/api/styles');
        if (!response.ok) {
          throw new Error('Failed to load style options');
        }
        const options = await response.json();
        setStyleOptions(options);
      } catch (error) {
        console.error('Error loading style options:', error);
        setError('加载风格选项失败');
      }
    };
    loadStyleOptions();
  }, []);

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
    body { 
      margin: 0; 
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
      background-color: white;
    }
    * { box-sizing: border-box; }
    
    /* 避免容器过宽 */
    .container, main, article, section, div {
      max-width: 100%;
    }
    
    /* 确保图片不会超出容器 */
    img {
      max-width: 100%;
      height: auto;
    }
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
        // 如果已经是完整的HTML文档，在头部插入额外的样式
        return htmlContent.replace('<head>', `<head>
  <style>
    body { 
      margin: 0; 
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
      background-color: white;
    }
    * { box-sizing: border-box; }
    
    /* 避免容器过宽 */
    .container, main, article, section, div {
      max-width: 100%;
    }
    
    /* 确保图片不会超出容器 */
    img {
      max-width: 100%;
      height: auto;
    }
  </style>`);
      } else {
        // 如果只是body或div标签，包装成HTML文档
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      margin: 0; 
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
      background-color: white;
    }
    * { box-sizing: border-box; }
    
    /* 避免容器过宽 */
    .container, main, article, section, div {
      max-width: 100%;
    }
    
    /* 确保图片不会超出容器 */
    img {
      max-width: 100%;
      height: auto;
    }
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
  <style>
    body { 
      margin: 0; 
      padding: 20px;
      font-family: system-ui, sans-serif;
      background-color: white;
    }
  </style>
</head>
<body>
  <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
    <h3>未找到有效的HTML内容</h3>
    <p>AI生成的内容中没有包含有效的HTML代码。</p>
    <pre style="background: #f5f5f5; padding: 15px; border-radius: 8px; overflow: auto;">${content}</pre>
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

  // 处理风格选择变化
  const handleStyleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const style = e.target.value;
    if (!style) return;

    try {
      const response = await fetch('/api/cover_style_select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ style }),
      });

      if (!response.ok) {
        throw new Error('Failed to load style prompt');
      }

      const data = await response.json();
      setSelectedStylePrompt(data.content);
    } catch (error) {
      console.error('Error loading style prompt:', error);
      setError('加载风格提示词失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setStreamContent('');
    setPreviewContent(null);

    try {
      const formData = new FormData(e.currentTarget);
      const style = formData.get('style') as string;
      const coverText = formData.get('coverText') as string;
      const accountName = formData.get('accountName') as string;
      const slogan = formData.get('slogan') as string;

      // 获取选中风格的内容
      const styleResponse = await fetch('/api/cover_style_select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ style }),
      });

      if (!styleResponse.ok) {
        throw new Error('Failed to load style content');
      }

      const styleData = await styleResponse.json();
      const styleContent = styleData.content;

      // 获取历史生成结果
      const coverResultResponse = await fetch('/api/cover_result');
      if (!coverResultResponse.ok) {
        throw new Error('Failed to load cover results');
      }

      const coverResults = await coverResultResponse.json();
      
      // 构建完整的系统提示词
      const cover_system_prompt_all = `${COVER_SYSTEM_PROMPT}

## 历史生成参考
${coverResults.map((result: CoverResult) => `
风格：${result.style}
文案：${result.coverText}
账号：${result.accountName}
${result.slogan ? `标语：${result.slogan}` : ''}
---
`).join('\n')}`;

      // 构建用户提示词
      const userPrompt = `
风格要求：
${styleContent}

内容要求：
封面文案：${coverText}
账号名称：${accountName}
${slogan ? `标语：${slogan}` : ''}
`;

      const response = await fetch('/api/HS_ds0325', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: cover_system_prompt_all },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover');
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
                style,
                coverText,
                accountName,
                slogan,
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
      // 显示加载状态
      setError('图片生成中，请稍候...');
      
      // 获取 iframe 中的内容
      const iframe = iframeRef.current;
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!iframeDocument || !iframeDocument.body) {
        setError('无法访问iframe内容，请检查预览是否正确加载');
        return;
      }

      // 动态加载 html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      // 在执行截图前，先确保所有样式都已加载，图像已渲染
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 创建一个新的容器，确保保持封面的3:4比例
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-9999px';
      container.style.width = '900px'; // 固定宽度
      container.style.height = '1200px'; // 固定高度，保持3:4比例
      container.style.overflow = 'hidden';
      container.style.backgroundColor = 'white';
      document.body.appendChild(container);
      
      // 克隆iframe内容到新容器
      const contentClone = iframeDocument.body.cloneNode(true) as HTMLElement;
      container.appendChild(contentClone);
      
      // 打印调试信息
      console.log('准备生成图片，容器大小:', container.offsetWidth, 'x', container.offsetHeight);
      
      // 生成图片
      const canvas = await html2canvas(container, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // 提高图片质量
        backgroundColor: '#ffffff',
        logging: true,
        width: 900,
        height: 1200,
        onclone: (clonedDoc) => {
          // 调整克隆文档中的样式
          const style = clonedDoc.createElement('style');
          style.textContent = `
            body, html {
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              width: 900px !important;
              height: 1200px !important;
              display: block !important;
            }
            * {
              box-sizing: border-box !important;
            }
          `;
          clonedDoc.head.appendChild(style);
          
          // 打印调试信息
          console.log('文档已克隆，准备渲染');
        }
      });
      
      // 移除临时容器
      document.body.removeChild(container);
      
      console.log('图片生成成功，宽度:', canvas.width, '高度:', canvas.height);
      
      // 转换为图片并下载
      const link = document.createElement('a');
      link.download = `cover-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
      // 清除状态消息
      setError(null);
    } catch (error) {
      console.error('Error generating image:', error);
      setError('生成图片失败，请确保预览内容已完全加载');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header & Navigation */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-sm shadow-sm z-50">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-gray-600 transition-colors">
            WebShaper
          </Link>
          <div className="space-x-6">
            <Link href="/card" className="text-gray-600 hover:text-gray-900">信息卡片</Link>
            <Link href="/cover" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              封面设计
            </Link>
            <a href="#" className="text-gray-600 hover:text-gray-900">SVG</a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold text-center mb-6 text-gray-800">
            一键生成小红书封面
          </h1>
          <p className="text-center text-gray-600 mb-8">
            创建并分享你的精美封面，展示你的创意和想法
          </p>
          
          {/* Form Section */}
          <section className="max-w-[1080px] mx-auto px-4 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Style Selection */}
              <div>
                <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-1">
                  风格选择
                </label>
                <select
                  id="style"
                  name="style"
                  className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                  onChange={handleStyleChange}
                >
                  <option value="">请选择风格...</option>
                  {styleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cover Text */}
              <div>
                <label htmlFor="coverText" className="block text-sm font-medium text-gray-700 mb-1">
                  封面文案
                </label>
                <textarea
                  id="coverText"
                  name="coverText"
                  className="w-full h-24 p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="输入封面主要文案..."
                  disabled={isLoading}
                />
              </div>

              {/* Account Name */}
              <div>
                <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
                  账号名称
                </label>
                <input
                  type="text"
                  id="accountName"
                  name="accountName"
                  className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入你的账号名称..."
                  disabled={isLoading}
                />
              </div>

              {/* Optional Slogan */}
              <div>
                <label htmlFor="slogan" className="block text-sm font-medium text-gray-700 mb-1">
                  标语（可选）
                </label>
                <input
                  type="text"
                  id="slogan"
                  name="slogan"
                  className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入标语..."
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? '生成中...' : '生成封面'}
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
                    onLoad={() => {
                      // 确保iframe内容加载完成后调整内容样式
                      if (iframeRef.current?.contentDocument?.body) {
                        const iframeDoc = iframeRef.current.contentDocument;
                        // 使图片和资源正确加载
                        const imgElements = iframeDoc.querySelectorAll('img');
                        imgElements.forEach(img => {
                          img.crossOrigin = 'anonymous';
                        });
                      }
                    }}
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
    </div>
  );
} 