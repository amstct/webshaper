'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CardData {
  title: string;
  subtitle: string;
  content: string;
  quote: string;
  style: string;
}

const CARD_SYSTEM_PROMPT = 
`你是一个专业的卡片设计助手。你需要根据用户输入的内容，生成一个精美的卡片设计。
卡片应该包含以下元素：
1. 标题
2. 副标题或简短描述
3. 主要内容
4. 引用或格言
5. 装饰性元素

请直接返回JSON对象，不要包含任何markdown格式或代码块标记，格式如下：
{
  "title": "卡片标题",
  "subtitle": "副标题",
  "content": "主要内容",
  "quote": "引用或格言",
  "style": "设计风格（如：极简主义、复古、现代等）"
}`;

export default function Home() {
  const [previewContent, setPreviewContent] = useState<CardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;
    
    try {
      const response = await fetch('/api/deepseek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content,
          systemPrompt: CARD_SYSTEM_PROMPT
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate card');
      }

      const data = await response.json();
      console.log('Received data from API:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPreviewContent(data);
    } catch (err) {
      setError('生成卡片时出错，请重试');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header & Navigation */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-sm shadow-sm z-50">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-gray-600 transition-colors">
            WebShaper
          </Link>
        </nav>
      </header>

      {/* Hero Section with CTAs */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold text-center mb-6 text-gray-800">
            创意设计工具集
          </h1>
          <p className="text-center text-gray-600 mb-12">
            选择你需要的设计工具，开始创作
          </p>

          {/* CTA Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card Design CTA */}
            <Link href="/card" className="group">
              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">信息卡片</h2>
                  <p className="text-gray-600 mb-6">创建精美的信息展示卡片，突出重要内容</p>
                  <div className="inline-flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                    开始设计
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* Cover Design CTA */}
            <Link href="/cover" className="group">
              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">封面设计</h2>
                  <p className="text-gray-600 mb-6">生成吸引眼球的小红书封面，提升内容表现力</p>
                  <div className="inline-flex items-center text-green-600 font-medium group-hover:text-green-700">
                    开始设计
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
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
