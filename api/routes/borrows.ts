import express from 'express';
import database from '../database/database.js';

const router = express.Router();

// 获取借阅记录列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', borrower = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let sql = `
      SELECT br.*, b.title, b.author, b.isbn, b.cover_url
      FROM borrows br
      LEFT JOIN books b ON br.book_id = b.id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    
    if (status) {
      sql += ` AND br.status = ?`;
      params.push(status);
    }
    
    if (borrower) {
      sql += ` AND br.borrower LIKE ?`;
      params.push(`%${borrower}%`);
    }
    
    sql += ` ORDER BY br.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);
    
    const borrows = database.queryAll(sql, params);
    
    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM borrows br WHERE 1=1`;
    const countParams: unknown[] = [];
    
    if (status) {
      countSql += ` AND br.status = ?`;
      countParams.push(status);
    }
    
    if (borrower) {
      countSql += ` AND br.borrower LIKE ?`;
      countParams.push(`%${borrower}%`);
    }
    
    const countResult = database.query(countSql, countParams);
    
    res.json({
      success: true,
      data: {
        borrows,
        total: countResult.total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('获取借阅记录失败:', error);
    res.status(500).json({ success: false, message: '获取借阅记录失败' });
  }
});

// 借阅图书
router.post('/', async (req, res) => {
  try {
    const { bookId, borrower, dueDate, contact, notes } = req.body;
    
    if (!bookId || !borrower) {
      return res.status(400).json({ success: false, message: '图书ID和借阅人不能为空' });
    }
    
    // 检查图书是否存在且可借阅
    const book = database.query('SELECT id, status FROM books WHERE id = ?', [bookId]);
    if (!book || Object.keys(book).length === 0) {
      return res.status(404).json({ success: false, message: '图书不存在' });
    }
    
    if (book.status !== 'available') {
      return res.status(400).json({ success: false, message: '图书当前不可借阅' });
    }
    
    // 计算归还期限
    let calculatedDueDate = dueDate;
    if (!calculatedDueDate) {
      const defaultDays = database.query(
        'SELECT value FROM settings WHERE key = "default_borrow_days"'
      );
      const days = defaultDays?.value ? parseInt(String(defaultDays.value)) : 30;
      const due = new Date();
      due.setDate(due.getDate() + days);
      calculatedDueDate = due.toISOString().split('T')[0];
    }
    
    // 创建借阅记录
    const borrowSql = `
      INSERT INTO borrows (book_id, borrower, due_date, contact, notes)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    database.run(borrowSql, [bookId, borrower, calculatedDueDate, contact || '', notes || '']);
    
    // 更新图书状态
    database.run('UPDATE books SET status = "borrowed" WHERE id = ?', [bookId]);
    
    res.json({
      success: true,
      message: '借阅成功',
      data: {
        bookId,
        borrower,
        dueDate: calculatedDueDate
      }
    });
  } catch (error) {
    console.error('借阅图书失败:', error);
    res.status(500).json({ success: false, message: '借阅图书失败' });
  }
});

// 归还图书
router.put('/:id/return', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查借阅记录是否存在
    const borrow = database.query(
      'SELECT id, book_id, status FROM borrows WHERE id = ?',
      [id]
    );
    
    if (!borrow || Object.keys(borrow).length === 0) {
      return res.status(404).json({ success: false, message: '借阅记录不存在' });
    }
    
    if ((borrow as any).status === 'returned') {
      return res.status(400).json({ success: false, message: '图书已归还' });
    }
    
    // 更新借阅记录
    database.run(
      'UPDATE borrows SET status = "returned", return_date = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    // 更新图书状态
    database.run('UPDATE books SET status = "available" WHERE id = ?', [(borrow as any).book_id]);
    
    res.json({ success: true, message: '归还成功' });
  } catch (error) {
    console.error('归还图书失败:', error);
    res.status(500).json({ success: false, message: '归还图书失败' });
  }
});

// 获取借阅统计
router.get('/statistics', async (req, res) => {
  try {
    // 总借阅次数
    const totalBorrows = database.query('SELECT COUNT(*) as count FROM borrows');
    
    // 当前借阅中的图书数量
    const currentBorrows = database.query(
      'SELECT COUNT(*) as count FROM borrows WHERE status = "borrowed"'
    );
    
    // 逾期未还的图书数量
    const overdueBorrows = database.query(
      'SELECT COUNT(*) as count FROM borrows WHERE status = "borrowed" AND due_date < date("now")'
    );
    
    // 最近借阅记录
    const recentBorrows = database.queryAll(`
      SELECT br.*, b.title, b.author
      FROM borrows br
      LEFT JOIN books b ON br.book_id = b.id
      ORDER BY br.created_at DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: {
        totalBorrows: totalBorrows.count || 0,
        currentBorrows: currentBorrows.count || 0,
        overdueBorrows: overdueBorrows.count || 0,
        recentBorrows
      }
    });
  } catch (error) {
    console.error('获取借阅统计失败:', error);
    res.status(500).json({ success: false, message: '获取借阅统计失败' });
  }
});

// 获取指定图书的借阅记录
router.get('/book/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    
    const borrows = database.queryAll(`
      SELECT br.*, b.title, b.author, b.isbn
      FROM borrows br
      LEFT JOIN books b ON br.book_id = b.id
      WHERE br.book_id = ?
      ORDER BY br.created_at DESC
    `, [bookId]);
    
    res.json({
      success: true,
      data: borrows
    });
  } catch (error) {
    console.error('获取图书借阅记录失败:', error);
    res.status(500).json({ success: false, message: '获取图书借阅记录失败' });
  }
});

// 获取即将到期的借阅记录
router.get('/due-soon', async (req, res) => {
  try {
    const { days = 3 } = req.query;
    
    const sql = `
      SELECT br.*, b.title, b.author, b.isbn
      FROM borrows br
      LEFT JOIN books b ON br.book_id = b.id
      WHERE br.status = "borrowed" 
        AND br.due_date <= date("now", "+" || ? || " days")
        AND br.due_date >= date("now")
      ORDER BY br.due_date ASC
    `;
    
    const dueSoonBorrows = database.queryAll(sql, [days]);
    
    res.json({
      success: true,
      data: dueSoonBorrows
    });
  } catch (error) {
    console.error('获取即将到期借阅记录失败:', error);
    res.status(500).json({ success: false, message: '获取即将到期借阅记录失败' });
  }
});

// 获取最近活动
router.get('/recent-activities', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const sql = `
      SELECT 
        br.id,
        br.borrower as userName,
        b.title as bookTitle,
        CASE 
          WHEN br.return_date IS NOT NULL THEN 'return'
          ELSE 'borrow'
        END as type,
        CASE 
          WHEN br.return_date IS NOT NULL THEN 
            CASE 
              WHEN (julianday('now') - julianday(br.return_date)) < 1 THEN 
                CAST((julianday('now') - julianday(br.return_date)) * 24 AS INTEGER) || '小时前'
              ELSE 
                CAST(julianday('now') - julianday(br.return_date) AS INTEGER) || '天前'
            END
          ELSE 
            CASE 
              WHEN (julianday('now') - julianday(br.created_at)) < 1 THEN 
                CAST((julianday('now') - julianday(br.created_at)) * 24 AS INTEGER) || '小时前'
              ELSE 
                CAST(julianday('now') - julianday(br.created_at) AS INTEGER) || '天前'
            END
        END as time
      FROM borrows br
      LEFT JOIN books b ON br.book_id = b.id
      ORDER BY 
        CASE 
          WHEN br.return_date IS NOT NULL THEN br.return_date
          ELSE br.created_at
        END DESC
      LIMIT ?
    `;
    
    const activities = database.queryAll(sql, [Number(limit)]);
    
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('获取最近活动失败:', error);
    res.status(500).json({ success: false, message: '获取最近活动失败' });
  }
});

export default router;