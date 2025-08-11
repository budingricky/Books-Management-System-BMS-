import express from 'express';
import database from '../database/database.js';

const router = express.Router();

// 获取所有分类
router.get('/', async (req, res) => {
  try {
    const { tree = false } = req.query;
    
    if (tree === 'true') {
      // 返回树形结构
      const categories = database.queryAll(
        'SELECT * FROM categories ORDER BY level, parent_id, code'
      );
      
      // 构建树形结构
      const categoryMap = new Map();
      const rootCategories = [];
      
      // 先创建所有节点
      categories.forEach(category => {
        categoryMap.set(category.id, {
          ...category,
          children: []
        });
      });
      
      // 构建父子关系
      categories.forEach(category => {
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children.push(categoryMap.get(category.id));
          }
        } else {
          rootCategories.push(categoryMap.get(category.id));
        }
      });
      
      res.json({
        success: true,
        data: rootCategories
      });
    } else {
      // 返回平铺结构
      const categories = database.queryAll(
        'SELECT * FROM categories ORDER BY level, parent_id, code'
      );
      
      res.json({
        success: true,
        data: categories
      });
    }
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({ success: false, message: '获取分类列表失败' });
  }
});

// 根据ID获取分类详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = database.query('SELECT * FROM categories WHERE id = ?', [id]);
    
    if (!category || Object.keys(category).length === 0) {
      return res.status(404).json({ success: false, message: '分类不存在' });
    }
    
    // 获取子分类
    const children = database.queryAll(
      'SELECT * FROM categories WHERE parent_id = ? ORDER BY code',
      [id]
    );
    
    // 获取该分类下的图书数量
    const bookCount = database.query(
      'SELECT COUNT(*) as count FROM books WHERE category_id = ?',
      [id]
    );
    
    res.json({
      success: true,
      data: {
        ...category,
        children,
        bookCount: (bookCount as any).count || 0
      }
    });
  } catch (error) {
    console.error('获取分类详情失败:', error);
    res.status(500).json({ success: false, message: '获取分类详情失败' });
  }
});

// 添加分类
router.post('/', async (req, res) => {
  try {
    const { name, code, parentId } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ success: false, message: '分类名称和编码不能为空' });
    }
    
    // 检查编码是否已存在
    const existingCategory = database.query(
      'SELECT id FROM categories WHERE code = ?',
      [code]
    );
    
    if (existingCategory && Object.keys(existingCategory).length > 0) {
      return res.status(400).json({ success: false, message: '分类编码已存在' });
    }
    
    // 确定层级
    let level = 1;
    if (parentId) {
      const parent = database.query(
        'SELECT level FROM categories WHERE id = ?',
        [parentId]
      );
      if (parent && Object.keys(parent).length > 0) {
        level = (parent as any).level + 1;
      }
    }
    
    const sql = `
      INSERT INTO categories (name, code, parent_id, level)
      VALUES (?, ?, ?, ?)
    `;
    
    const result = database.run(sql, [name, code, parentId || null, level]);
    
    res.status(201).json({
      success: true,
      message: '分类添加成功',
      data: { id: (result as any).lastInsertRowid }
    });
  } catch (error) {
    console.error('添加分类失败:', error);
    res.status(500).json({ success: false, message: '添加分类失败' });
  }
});

// 更新分类
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, parentId } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ success: false, message: '分类名称和编码不能为空' });
    }
    
    // 检查分类是否存在
    const category = database.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (!category || Object.keys(category).length === 0) {
      return res.status(404).json({ success: false, message: '分类不存在' });
    }
    
    // 检查编码是否被其他分类使用
    const existingCategory = database.query(
      'SELECT id FROM categories WHERE code = ? AND id != ?',
      [code, id]
    );
    
    if (existingCategory && Object.keys(existingCategory).length > 0) {
      return res.status(400).json({ success: false, message: '分类编码已被其他分类使用' });
    }
    
    // 确定层级
    let level = 1;
    if (parentId) {
      const parent = database.query(
        'SELECT level FROM categories WHERE id = ?',
        [parentId]
      );
      if (parent && Object.keys(parent).length > 0) {
        level = (parent as any).level + 1;
      }
    }
    
    const sql = `
      UPDATE categories SET name = ?, code = ?, parent_id = ?, level = ?
      WHERE id = ?
    `;
    
    database.run(sql, [name, code, parentId || null, level, id]);
    
    res.json({ success: true, message: '分类更新成功' });
  } catch (error) {
    console.error('更新分类失败:', error);
    res.status(500).json({ success: false, message: '更新分类失败' });
  }
});

// 删除分类
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查是否有子分类
    const children = database.query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
      [id]
    );
    
    if ((children as any).count > 0) {
      return res.status(400).json({ success: false, message: '该分类下还有子分类，无法删除' });
    }
    
    // 检查是否有图书使用该分类
    const books = database.query(
      'SELECT COUNT(*) as count FROM books WHERE category_id = ?',
      [id]
    );
    
    if ((books as any).count > 0) {
      return res.status(400).json({ success: false, message: '该分类下还有图书，无法删除' });
    }
    
    const result = database.run('DELETE FROM categories WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '分类不存在' });
    }
    
    res.json({ success: true, message: '分类删除成功' });
  } catch (error) {
    console.error('删除分类失败:', error);
    res.status(500).json({ success: false, message: '删除分类失败' });
  }
});

// 获取分类统计
router.get('/statistics/overview', async (req, res) => {
  try {
    // 获取每个分类的图书数量
    const categoryStats = database.queryAll(`
      SELECT 
        c.id,
        c.name,
        c.code,
        c.level,
        COUNT(b.id) as book_count,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_count,
        COUNT(CASE WHEN b.status = 'borrowed' THEN 1 END) as borrowed_count
      FROM categories c
      LEFT JOIN books b ON c.id = b.category_id
      GROUP BY c.id, c.name, c.code, c.level
      ORDER BY c.level, c.code
    `);
    
    res.json({
      success: true,
      data: categoryStats
    });
  } catch (error) {
    console.error('获取分类统计失败:', error);
    res.status(500).json({ success: false, message: '获取分类统计失败' });
  }
});

export default router;