import express from 'express';
import database from '../database/database.js';

const router = express.Router();

// 获取系统总体统计
router.get('/overview', async (req, res) => {
  try {
    // 图书总数
    const totalBooks = database.query('SELECT COUNT(*) as count FROM books');
    
    // 可借阅图书数
    const availableBooks = database.query(
      'SELECT COUNT(*) as count FROM books WHERE status = "available"'
    );
    
    // 已借出图书数
    const borrowedBooks = database.query(
      'SELECT COUNT(*) as count FROM books WHERE status = "borrowed"'
    );
    
    // 总借阅次数
    const totalBorrows = database.query('SELECT COUNT(*) as count FROM borrows');
    
    // 当前借阅中的记录数
    const currentBorrows = database.query(
      'SELECT COUNT(*) as count FROM borrows WHERE status = "borrowed"'
    );
    
    // 逾期未还数量
    const overdueBorrows = database.query(
      'SELECT COUNT(*) as count FROM borrows WHERE status = "borrowed" AND due_date < date("now")'
    );
    
    // 分类总数
    const totalCategories = database.query('SELECT COUNT(*) as count FROM categories');
    
    res.json({
      success: true,
      data: {
        totalBooks: totalBooks.count || 0,
        availableBooks: availableBooks.count || 0,
        borrowedBooks: borrowedBooks.count || 0,
        totalBorrows: totalBorrows.count || 0,
        currentBorrows: currentBorrows.count || 0,
        overdueBorrows: overdueBorrows.count || 0,
        totalCategories: totalCategories.count || 0
      }
    });
  } catch (error) {
    console.error('获取系统统计失败:', error);
    res.status(500).json({ success: false, message: '获取系统统计失败' });
  }
});

// 获取图书状态分布
router.get('/books-status', async (req, res) => {
  try {
    const statusStats = database.queryAll(`
      SELECT 
        status,
        COUNT(*) as count
      FROM books 
      GROUP BY status
    `);
    
    res.json({
      success: true,
      data: statusStats
    });
  } catch (error) {
    console.error('获取图书状态统计失败:', error);
    res.status(500).json({ success: false, message: '获取图书状态统计失败' });
  }
});

// 获取分类图书分布
router.get('/books-by-category', async (req, res) => {
  try {
    const categoryStats = database.queryAll(`
      SELECT 
        c.name as category_name,
        c.code as category_code,
        COUNT(b.id) as book_count
      FROM categories c
      LEFT JOIN books b ON c.id = b.category_id
      GROUP BY c.id, c.name, c.code
      ORDER BY book_count DESC
    `);
    
    res.json({
      success: true,
      data: categoryStats
    });
  } catch (error) {
    console.error('获取分类图书统计失败:', error);
    res.status(500).json({ success: false, message: '获取分类图书统计失败' });
  }
});

// 获取借阅趋势（最近30天）
router.get('/borrow-trend', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const trendData = database.queryAll(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as borrow_count
      FROM borrows 
      WHERE created_at >= date('now', '-' || ? || ' days')
      GROUP BY date(created_at)
      ORDER BY date
    `, [days]);
    
    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('获取借阅趋势失败:', error);
    res.status(500).json({ success: false, message: '获取借阅趋势失败' });
  }
});

// 获取热门图书（借阅次数最多）
router.get('/popular-books', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const popularBooks = database.queryAll(`
      SELECT 
        b.id,
        b.title,
        b.author,
        b.isbn,
        COUNT(br.id) as borrow_count
      FROM books b
      LEFT JOIN borrows br ON b.id = br.book_id
      GROUP BY b.id, b.title, b.author, b.isbn
      HAVING borrow_count > 0
      ORDER BY borrow_count DESC
      LIMIT ?
    `, [Number(limit)]);
    
    res.json({
      success: true,
      data: popularBooks
    });
  } catch (error) {
    console.error('获取热门图书失败:', error);
    res.status(500).json({ success: false, message: '获取热门图书失败' });
  }
});

// 获取活跃借阅者
router.get('/active-borrowers', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const activeBorrowers = database.queryAll(`
      SELECT 
        borrower,
        COUNT(*) as borrow_count,
        COUNT(CASE WHEN status = 'borrowed' THEN 1 END) as current_borrows
      FROM borrows
      GROUP BY borrower
      ORDER BY borrow_count DESC
      LIMIT ?
    `, [Number(limit)]);
    
    res.json({
      success: true,
      data: activeBorrowers
    });
  } catch (error) {
    console.error('获取活跃借阅者失败:', error);
    res.status(500).json({ success: false, message: '获取活跃借阅者失败' });
  }
});

// 获取逾期统计
router.get('/overdue-analysis', async (req, res) => {
  try {
    // 逾期图书列表
    const overdueBooks = database.queryAll(`
      SELECT 
        br.id,
        br.borrower,
        br.due_date,
        br.created_at,
        b.title,
        b.author,
        b.isbn,
        julianday('now') - julianday(br.due_date) as overdue_days
      FROM borrows br
      LEFT JOIN books b ON br.book_id = b.id
      WHERE br.status = 'borrowed' AND br.due_date < date('now')
      ORDER BY overdue_days DESC
    `);
    
    // 逾期统计
    const overdueStats = {
      total: overdueBooks.length,
      within7Days: overdueBooks.filter(b => b.overdue_days <= 7).length,
      within30Days: overdueBooks.filter(b => b.overdue_days <= 30).length,
      over30Days: overdueBooks.filter(b => b.overdue_days > 30).length
    };
    
    res.json({
      success: true,
      data: {
        overdueBooks,
        overdueStats
      }
    });
  } catch (error) {
    console.error('获取逾期分析失败:', error);
    res.status(500).json({ success: false, message: '获取逾期分析失败' });
  }
});

// 获取月度统计
router.get('/monthly-stats', async (req, res) => {
  try {
    // 本月新增图书数量
    const newBooks = database.query(`
      SELECT COUNT(*) as count 
      FROM books 
      WHERE date(created_at) >= date('now', 'start of month')
    `);
    
    // 本月借阅次数
    const monthlyBorrows = database.query(`
      SELECT COUNT(*) as count 
      FROM borrows 
      WHERE date(created_at) >= date('now', 'start of month')
    `);
    
    // 热门分类（本月借阅最多的分类）
    const popularCategoryResult = database.query(`
      SELECT c.name
      FROM borrows br
      LEFT JOIN books b ON br.book_id = b.id
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE date(br.created_at) >= date('now', 'start of month')
        AND c.name IS NOT NULL
      GROUP BY c.id, c.name
      ORDER BY COUNT(*) DESC
      LIMIT 1
    `);
    
    res.json({
      success: true,
      data: {
        newBooks: newBooks?.count || 0,
        monthlyBorrows: monthlyBorrows?.count || 0,
        popularCategory: popularCategoryResult?.name || '暂无数据'
      }
    });
  } catch (error) {
    console.error('获取月度统计失败:', error);
    res.status(500).json({ success: false, message: '获取月度统计失败' });
  }
});

export default router;