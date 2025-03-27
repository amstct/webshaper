import fs from 'fs';
import path from 'path';

export interface CoverResult {
  timestamp: string;
  style: string;
  coverText: string;
  accountName: string;
  slogan?: string;
  content: string;
}

export async function saveCoverResult(result: CoverResult) {
  try {
    // 使用项目根目录作为基准
    const projectRoot = process.cwd();
    console.log('Current working directory:', projectRoot);
    
    const resultDir = path.join(projectRoot, 'data', 'cover_result');
    console.log('Target directory:', resultDir);
    
    // 确保目录存在
    try {
      await fs.promises.mkdir(resultDir, { recursive: true });
      console.log('Directory created or already exists:', resultDir);
    } catch (dirError) {
      console.error('Error creating directory:', dirError);
      throw dirError;
    }
    
    // 生成文件名：将时间戳中的冒号替换为下划线
    const safeTimestamp = result.timestamp.replace(/:/g, '_');
    const fileName = `${safeTimestamp}.json`;
    const filePath = path.join(resultDir, fileName);
    console.log('Target file path:', filePath);

    // 创建文件并写入内容
    try {
      // 先创建空文件
      await fs.promises.writeFile(filePath, '', { flag: 'w' });
      console.log('Created empty file:', filePath);
      
      // 然后写入内容
      await fs.promises.writeFile(filePath, JSON.stringify(result, null, 2), 'utf-8');
      console.log('Successfully wrote content to file:', filePath);
      
      return { success: true, filePath };
    } catch (writeError) {
      console.error('Error writing file:', writeError);
      throw writeError;
    }
  } catch (error) {
    console.error('Error saving cover result:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any).code,
      path: (error as any).path
    });
    return { success: false, error };
  }
}

export async function getCoverResults() {
  try {
    const projectRoot = process.cwd();
    console.log('Current working directory:', projectRoot);
    
    const resultDir = path.join(projectRoot, 'data', 'cover_result');
    console.log('Target directory:', resultDir);
    
    // 检查目录是否存在
    if (!fs.existsSync(resultDir)) {
      console.log('Directory does not exist');
      return [];
    }
    
    // 读取所有 JSON 文件
    const files = await fs.promises.readdir(resultDir);
    console.log('Found files:', files);
    
    const results = await Promise.all(
      files
        .filter(file => file.endsWith('.json'))
        .map(async (file) => {
          const filePath = path.join(resultDir, file);
          const content = await fs.promises.readFile(filePath, 'utf-8');
          return JSON.parse(content);
        })
    );

    // 按时间戳降序排序
    return results.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error getting cover results:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any).code,
      path: (error as any).path
    });
    return [];
  }
} 