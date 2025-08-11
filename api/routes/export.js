import express from 'express';
import database from '../database/database.js';

const router = express.Router();

// 导出图书数据
router.get('/books', async (req, res) => {
  try {
    const { format = 'excel' } = req.query;
    
    // 获取所有图书数据，包括分类信息
    const books = database.queryAll(`
      SELECT 
        b.id,
        b.title,
        b.author,
        b.isbn,
        b.publisher,
        b.publish_date,
        b.category_id,
        c.name as category_name,
        b.room as location_room,
        b.shelf as location_shelf,
        b.row as location_row,
        b.column as location_column,
        b.number as book_number,
        b.status,
        b.cover_url,
        b.created_at,
        b.updated_at
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      ORDER BY b.created_at DESC
    `);
    
    if (format === 'excel') {
      // 设置Excel文件下载响应头
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="books_export_${new Date().toISOString().split('T')[0]}.xlsx"`);
      
      // 简化的CSV格式作为Excel替代
      const csvHeader = 'ID,书名,作者,ISBN,出版社,出版日期,分类,位置,书号,状态,创建时间\n';
      const csvData = books.map(book => {
        const location = `${book.location_room || ''}-${book.location_shelf || ''}-${book.location_row || ''}-${book.location_column || ''}`;
        const status = book.status === 'available' ? '可借阅' : book.status === 'borrowed' ? '已借出' : '维护中';
        return `${book.id},"${book.title}","${book.author}","${book.isbn}","${book.publisher}","${book.publish_date}","${book.category_name || ''}","${location}","${book.book_number || ''}","${status}","${book.created_at}"`;
      }).join('\n');
      
      res.send(csvHeader + csvData);
    } else {
      res.json({
        success: true,
        data: books,
        total: books.length
      });
    }
  } catch (error) {
    console.error('导出图书数据失败:', error);
    res.status(500).json({ success: false, message: '导出图书数据失败' });
  }
});

// 导出借阅数据
router.get('/borrows', async (req, res) => {
  try {
    const { format = 'excel' } = req.query;
    
    // 获取所有借阅数据，包括图书和借阅者信息
    const borrows = database.queryAll(`
      SELECT 
        br.id,
        br.book_id,
        b.title as book_title,
        b.author as book_author,
        b.isbn,
        br.borrower,
        br.contact,
        br.borrow_date,
        br.due_date,
        br.return_date,
        br.status,
        br.created_at,
        br.updated_at,
        CASE 
          WHEN br.status = 'returned' THEN '已归还'
          WHEN br.status = 'borrowed' AND date(br.due_date) < date('now') THEN '逾期'
          WHEN br.status = 'borrowed' THEN '借阅中'
          ELSE br.status
        END as status_text
      FROM borrows br
      LEFT JOIN books b ON br.book_id = b.id
      ORDER BY br.created_at DESC
    `);
    
    if (format === 'excel') {
      // 设置Excel文件下载响应头
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="borrows_export_${new Date().toISOString().split('T')[0]}.xlsx"`);
      
      // 简化的CSV格式作为Excel替代
      const csvHeader = 'ID,图书标题,作者,ISBN,借阅者,联系方式,借阅日期,应还日期,归还日期,状态,创建时间\n';
      const csvData = borrows.map(borrow => {
        return `${borrow.id},"${borrow.book_title || ''}","${borrow.book_author || ''}","${borrow.isbn || ''}","${borrow.borrower}","${borrow.contact || ''}","${borrow.borrow_date}","${borrow.due_date}","${borrow.return_date || ''}","${borrow.status_text}","${borrow.created_at}"`;
      }).join('\n');
      
      res.send(csvHeader + csvData);
    } else {
      res.json({
        success: true,
        data: borrows,
        total: borrows.length
      });
    }
  } catch (error) {
    console.error('导出借阅数据失败:', error);
    res.status(500).json({ success: false, message: '导出借阅数据失败' });
  }
});

export default router;