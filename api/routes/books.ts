import express from 'express';
import database from '../database/database.js';

const router = express.Router();

// 获取图书列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', category = '', status = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let sql = `
      SELECT b.*, c.name as category_name 
      FROM books b 
      LEFT JOIN categories c ON b.category_id = c.id 
      WHERE 1=1
    `;
    const params: unknown[] = [];
    
    if (search) {
      sql += ` AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    if (category) {
      sql += ` AND b.category_id = ?`;
      params.push(category);
    }
    
    if (status) {
      sql += ` AND b.status = ?`;
      params.push(status);
    }
    
    sql += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);
    
    const books = database.queryAll(sql, params);
    
    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM books b WHERE 1=1`;
    const countParams: unknown[] = [];
    
    if (search) {
      countSql += ` AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)`;
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam);
    }
    
    if (category) {
      countSql += ` AND b.category_id = ?`;
      countParams.push(category);
    }
    
    if (status) {
      countSql += ` AND b.status = ?`;
      countParams.push(status);
    }
    
    const countResult = database.query(countSql, countParams);
    
    res.json({
      success: true,
      data: {
        books,
        total: countResult.total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('获取图书列表失败:', error);
    res.status(500).json({ success: false, message: '获取图书列表失败' });
  }
});

// 搜索图书
router.get('/search', async (req, res) => {
  try {
    const { q = '', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    if (!q) {
      return res.json({
        success: true,
        data: {
          books: [],
          total: 0,
          page: Number(page),
          limit: Number(limit)
        }
      });
    }
    
    const searchParam = `%${q}%`;
    const sql = `
      SELECT b.*, c.name as category_name 
      FROM books b 
      LEFT JOIN categories c ON b.category_id = c.id 
      WHERE b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?
      ORDER BY b.created_at DESC LIMIT ? OFFSET ?
    `;
    
    const books = database.queryAll(sql, [searchParam, searchParam, searchParam, Number(limit), offset]);
    
    // 获取总数
    const countSql = `
      SELECT COUNT(*) as total FROM books b 
      WHERE b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?
    `;
    const countResult = database.query(countSql, [searchParam, searchParam, searchParam]);
    
    res.json({
      success: true,
      data: {
        books,
        total: countResult.total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('搜索图书失败:', error);
    res.status(500).json({ success: false, message: '搜索图书失败' });
  }
});

// 根据ID获取图书详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT b.*, c.name as category_name 
      FROM books b 
      LEFT JOIN categories c ON b.category_id = c.id 
      WHERE b.id = ?
    `;
    
    const book = database.query(sql, [id]);
    
    if (!book || Object.keys(book).length === 0) {
      return res.status(404).json({ success: false, message: '图书不存在' });
    }
    
    res.json({ success: true, data: book });
  } catch (error) {
    console.error('获取图书详情失败:', error);
    res.status(500).json({ success: false, message: '获取图书详情失败' });
  }
});

// 添加图书
router.post('/', async (req, res) => {
  try {
    const {
      isbn,
      title,
      author,
      publisher,
      publication_date,
      category_id,
      cover_url,
      description,
      price,
      room,
      shelf,
      row,
      column,
      number
    } = req.body;
    
    // 验证必填字段
    if (!isbn || !title || !author) {
      return res.status(400).json({ success: false, message: '请填写必填字段：ISBN、书名、作者' });
    }
    
    // 检查ISBN是否已存在
    const existingBook = database.query('SELECT id FROM books WHERE isbn = ?', [isbn]);
    if (existingBook && Object.keys(existingBook).length > 0) {
      return res.status(400).json({ success: false, message: 'ISBN已存在' });
    }
    
    const sql = `
      INSERT INTO books (
        isbn, title, author, publisher, publish_date, category_id,
        cover_url, description, price, room, shelf, row, column, number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = database.run(sql, [
      isbn || '',
      title || '',
      author || '',
      publisher || '',
      publication_date || null,
      category_id || null,
      cover_url || '',
      description || '',
      price || 0,
      room || '',
      shelf || '',
      row || '',
      column || '',
      number || ''
    ]);
    
    res.status(201).json({
      success: true,
      message: '图书添加成功',
      data: { id: (result as any).lastInsertRowid }
    });
  } catch (error) {
    console.error('添加图书失败:', error);
    res.status(500).json({ success: false, message: '添加图书失败' });
  }
});

// 更新图书
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      author,
      publisher,
      publication_date,
      category_id,
      cover_url,
      description,
      price,
      room,
      shelf,
      row,
      column,
      number,
      status
    } = req.body;
    
    // 验证必填字段
    if (!title || !author) {
      return res.status(400).json({ success: false, message: '请填写必填字段：书名、作者' });
    }
    
    const sql = `
      UPDATE books SET 
        title = ?, author = ?, publisher = ?, publish_date = ?,
        category_id = ?, cover_url = ?, description = ?, price = ?,
        room = ?, shelf = ?, row = ?, column = ?, number = ?,
        status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = database.run(sql, [
      title || '',
      author || '',
      publisher || '',
      publication_date || null,
      category_id || null,
      cover_url || '',
      description || '',
      price || 0,
      room || '',
      shelf || '',
      row || '',
      column || '',
      number || '',
      status || 'available',
      id
    ]);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '图书不存在' });
    }
    
    res.json({ success: true, message: '图书更新成功' });
  } catch (error) {
    console.error('更新图书失败:', error);
    res.status(500).json({ success: false, message: '更新图书失败' });
  }
});

// 删除图书
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查是否有未归还的借阅记录
    const borrowRecord = database.query(
      'SELECT id FROM borrows WHERE book_id = ? AND status = "borrowed"',
      [id]
    );
    
    if (borrowRecord && Object.keys(borrowRecord).length > 0) {
      return res.status(400).json({ success: false, message: '该图书还有未归还的借阅记录，无法删除' });
    }
    
    const result = database.run('DELETE FROM books WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '图书不存在' });
    }
    
    res.json({ success: true, message: '图书删除成功' });
  } catch (error) {
    console.error('删除图书失败:', error);
    res.status(500).json({ success: false, message: '删除图书失败' });
  }
});

// 批量创建图书
router.post('/batch', async (req, res) => {
  try {
    const { books } = req.body;
    
    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ success: false, message: '图书列表不能为空' });
    }
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      try {
        const {
          isbn,
          title,
          author,
          publisher,
          publication_date,
          category_id,
          cover_url,
          description,
          price,
          room,
          shelf,
          row,
          column,
          number
        } = book;
        
        // 验证必填字段
        if (!isbn || !title || !author) {
          errors.push({ index: i, isbn, error: '请填写必填字段：ISBN、书名、作者' });
          continue;
        }
        
        // 检查ISBN是否已存在
        const existingBook = database.query('SELECT id FROM books WHERE isbn = ?', [isbn]);
        if (existingBook && Object.keys(existingBook).length > 0) {
          errors.push({ index: i, isbn, error: 'ISBN已存在' });
          continue;
        }
        
        const sql = `
          INSERT INTO books (
            isbn, title, author, publisher, publish_date, category_id,
            cover_url, description, price, room, shelf, row, column, number
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = database.run(sql, [
          isbn || '',
          title || '',
          author || '',
          publisher || '',
          publication_date || null,
          category_id || null,
          cover_url || '',
          description || '',
          price || 0,
          room || '',
          shelf || '',
          row || '',
          column || '',
          number || ''
        ]);
        
        results.push({ index: i, isbn, id: (result as any).lastInsertRowid });
      } catch (error) {
        console.error(`批量添加图书失败 (索引 ${i}):`, error);
        errors.push({ index: i, isbn: book.isbn, error: '添加失败' });
      }
    }
    
    res.json({
      success: true,
      message: `批量添加完成，成功 ${results.length} 本，失败 ${errors.length} 本`,
      data: {
        success: results,
        errors: errors,
        total: books.length,
        successCount: results.length,
        errorCount: errors.length
      }
    });
  } catch (error) {
    console.error('批量添加图书失败:', error);
    res.status(500).json({ success: false, message: '批量添加图书失败' });
  }
});

export default router;