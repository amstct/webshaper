import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = 
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

export async function POST(request: Request) {
  try {
    const { content: userContent } = await request.json();
    console.log('Received content:', userContent);

    const response = await fetch(process.env.SILICONFLOW_API_URL!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "Qwen/QwQ-32B",
        stream: false,
        max_tokens: 4096,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        frequency_penalty: 0.5,
        n: 1,
        messages: [
          {
            content: SYSTEM_PROMPT,
            role: "system"
          },
          {
            content: `请根据以下内容生成一个精美的卡片设计：${userContent}`,
            role: "user"
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      throw new Error('API request failed');
    }

    const data = await response.json();
    console.log('API response data:', data);

    // 解析返回的 JSON 字符串
    const aiResponse = data.choices[0].message.content;
    console.log('AI response:', aiResponse);
    
    let parsedContent;
    try {
      // 清理可能的 markdown 格式
      const cleanResponse = aiResponse
        .replace(/```json\n?/g, '')  // 移除 ```json 标记
        .replace(/```\n?/g, '')      // 移除结束的 ``` 标记
        .trim();                     // 移除首尾空白
      
      console.log('Cleaned response:', cleanResponse);
      parsedContent = JSON.parse(cleanResponse);
    } catch (e) {
      console.error('Failed to parse content as JSON:', e);
      return NextResponse.json(
        { error: 'Invalid response format' },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedContent);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate card' },
      { status: 500 }
    );
  }
} 