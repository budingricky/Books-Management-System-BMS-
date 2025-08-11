import express from 'express';
import axios from 'axios';
import database from '../database/database.js';

const router = express.Router();

// 通过ISBN获取图书信息
router.get('/:isbn', async (req, res) => {
  try {
    const { isbn } = req.params;
    
    if (!isbn) {
      return res.status(400).json({ success: false, message: 'ISBN不能为空' });
    }
    
    // 获取API密钥
    const apiKeyResult = database.query(
      'SELECT value FROM settings WHERE key = "isbn_api_key"'
    );
    const apiKey = apiKeyResult?.value || '17e871ea05cd4396b5ce985308fa113f';
    
    // 调用ISBN API
    const apiUrl = `https://data.isbn.work/openApi/getInfoByIsbn?isbn=${isbn}&appKey=${apiKey}`;
    
    const response = await axios.get(apiUrl, {
      timeout: 10000, // 10秒超时
      headers: {
        'User-Agent': 'Library Management System'
      }
    });
    
    if (response.data.code === 0 && response.data.data) {
      const bookData = response.data.data;
      
      // 处理封面图片URL
      let coverUrl = '';
      if (bookData.pictures) {
        try {
          const pictures = JSON.parse(bookData.pictures);
          if (Array.isArray(pictures) && pictures.length > 0) {
            coverUrl = pictures[0];
          }
        } catch {
          // 如果解析失败，尝试直接使用
          if (typeof bookData.pictures === 'string' && bookData.pictures.startsWith('http')) {
            coverUrl = bookData.pictures;
          }
        }
      }
      
      // 格式化价格（从分转换为元）
      const price = bookData.price ? (bookData.price / 100).toFixed(2) : null;
      
      const formattedData = {
        isbn: bookData.isbn,
        title: bookData.bookName || '',
        author: bookData.author || '',
        publisher: bookData.press || '',
        publishDate: bookData.pressDate || '',
        publishPlace: bookData.pressPlace || '',
        price: price,
        coverUrl: coverUrl,
        description: bookData.bookDesc || '',
        binding: bookData.binding || '',
        language: bookData.language || '',
        format: bookData.format || '',
        pages: bookData.pages || '',
        edition: bookData.edition || '',
        words: bookData.words || '',
        clcCode: bookData.clcCode || '',
        clcName: bookData.clcName || ''
      };
      
      res.json({
        success: true,
        data: formattedData
      });
    } else {
      res.status(404).json({
        success: false,
        message: '未找到该ISBN对应的图书信息'
      });
    }
  } catch (error) {
    console.error('获取ISBN信息失败:', error);
    
    if (error.code === 'ECONNABORTED') {
      res.status(408).json({ success: false, message: '请求超时，请稍后重试' });
    } else if (error.response) {
      res.status(500).json({ 
        success: false, 
        message: `API请求失败: ${error.response.status}` 
      });
    } else {
      res.status(500).json({ success: false, message: '获取图书信息失败' });
    }
  }
});

// 批量获取ISBN信息
router.post('/batch', async (req, res) => {
  try {
    const { isbns } = req.body;
    
    if (!Array.isArray(isbns) || isbns.length === 0) {
      return res.status(400).json({ success: false, message: 'ISBN列表不能为空' });
    }
    
    if (isbns.length > 10) {
      return res.status(400).json({ success: false, message: '一次最多查询10个ISBN' });
    }
    
    // 获取API密钥
    const apiKeyResult = database.query(
      'SELECT value FROM settings WHERE key = "isbn_api_key"'
    );
    const apiKey = apiKeyResult?.value || '17e871ea05cd4396b5ce985308fa113f';
    
    const results = [];
    
    // 串行请求，避免并发过多
    for (const isbn of isbns) {
      try {
        const apiUrl = `https://data.isbn.work/openApi/getInfoByIsbn?isbn=${isbn}&appKey=${apiKey}`;
        
        const response = await axios.get(apiUrl, {
          timeout: 8000,
          headers: {
            'User-Agent': 'Library Management System'
          }
        });
        
        if (response.data.code === 0 && response.data.data) {
          const bookData = response.data.data;
          
          // 处理封面图片URL
          let coverUrl = '';
          if (bookData.pictures) {
            try {
              const pictures = JSON.parse(bookData.pictures);
              if (Array.isArray(pictures) && pictures.length > 0) {
                coverUrl = pictures[0];
              }
            } catch {
              if (typeof bookData.pictures === 'string' && bookData.pictures.startsWith('http')) {
                coverUrl = bookData.pictures;
              }
            }
          }
          
          results.push({
            isbn: bookData.isbn,
            title: bookData.bookName || '',
            author: bookData.author || '',
            publisher: bookData.press || '',
            publishDate: bookData.pressDate || '',
            coverUrl: coverUrl,
            description: bookData.bookDesc || '',
            clcCode: bookData.clcCode || '',
            clcName: bookData.clcName || '',
            success: true
          });
        } else {
          results.push({
            isbn: isbn,
            success: false,
            message: '未找到图书信息'
          });
        }
        
        // 添加延迟，避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`获取ISBN ${isbn} 信息失败:`, error);
        results.push({
          isbn: isbn,
          success: false,
          message: '获取图书信息失败'
        });
      }
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('批量获取ISBN信息失败:', error);
    res.status(500).json({ success: false, message: '批量获取图书信息失败' });
  }
});

export default router;