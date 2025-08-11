import express from 'express';
import database from '../database/database.js';

const router = express.Router();

// 获取所有设置
router.get('/', async (req, res) => {
  try {
    const settings = database.queryAll('SELECT * FROM settings ORDER BY key');
    
    // 转换为键值对格式
    const settingsMap = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = {
        value: setting.value,
        description: setting.description,
        type: setting.type,
        updatedAt: setting.updated_at
      };
    });
    
    res.json({
      success: true,
      data: settingsMap
    });
  } catch (error) {
    console.error('获取设置失败:', error);
    res.status(500).json({ success: false, message: '获取设置失败' });
  }
});

// 根据key获取单个设置
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = database.query('SELECT * FROM settings WHERE key = ?', [key]);
    
    if (!setting || Object.keys(setting).length === 0) {
      return res.status(404).json({ success: false, message: '设置项不存在' });
    }
    
    res.json({
      success: true,
      data: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
        type: setting.type,
        updatedAt: setting.updated_at
      }
    });
  } catch (error) {
    console.error('获取设置失败:', error);
    res.status(500).json({ success: false, message: '获取设置失败' });
  }
});

// 更新设置
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ success: false, message: '设置值不能为空' });
    }
    
    // 检查设置是否存在
    const existingSetting = database.query('SELECT * FROM settings WHERE key = ?', [key]);
    
    if (!existingSetting || Object.keys(existingSetting).length === 0) {
      return res.status(404).json({ success: false, message: '设置项不存在' });
    }
    
    // 验证设置值类型
    const settingType = existingSetting.type;
    let validatedValue = value;
    
    switch (settingType) {
      case 'number':
        validatedValue = Number(value);
        if (isNaN(validatedValue)) {
          return res.status(400).json({ success: false, message: '设置值必须是数字' });
        }
        break;
      case 'boolean':
        if (typeof value === 'string') {
          validatedValue = value.toLowerCase() === 'true';
        } else {
          validatedValue = Boolean(value);
        }
        break;
      case 'string':
        validatedValue = String(value);
        break;
      default:
        validatedValue = String(value);
    }
    
    // 特殊验证
    if (key === 'borrow_days' && validatedValue <= 0) {
      return res.status(400).json({ success: false, message: '借阅天数必须大于0' });
    }
    
    if (key === 'max_borrow_books' && validatedValue <= 0) {
      return res.status(400).json({ success: false, message: '最大借阅数量必须大于0' });
    }
    
    const sql = `
      UPDATE settings 
      SET value = ?, description = COALESCE(?, description), updated_at = datetime('now')
      WHERE key = ?
    `;
    
    database.run(sql, [String(validatedValue), description, key]);
    
    res.json({ success: true, message: '设置更新成功' });
  } catch (error) {
    console.error('更新设置失败:', error);
    res.status(500).json({ success: false, message: '更新设置失败' });
  }
});

// 批量更新设置
router.put('/', async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: '设置数据格式错误' });
    }
    
    const errors = [];
    const updates = [];
    
    // 验证所有设置
    for (const [key, value] of Object.entries(settings)) {
      try {
        const existingSetting = database.query('SELECT * FROM settings WHERE key = ?', [key]);
        
        if (!existingSetting) {
          errors.push(`设置项 ${key} 不存在`);
          continue;
        }
        
        // 验证设置值类型
        const settingType = existingSetting.type || 'string';
        let validatedValue: string | number | boolean;
        
        switch (settingType) {
          case 'number': {
            const numValue = Number(value);
            if (isNaN(numValue)) {
              errors.push(`设置项 ${key} 的值必须是数字`);
              continue;
            }
            validatedValue = numValue;
            break;
          }
          case 'boolean':
            if (typeof value === 'string') {
              validatedValue = value.toLowerCase() === 'true';
            } else {
              validatedValue = Boolean(value);
            }
            break;
          case 'string':
            validatedValue = String(value);
            break;
          default:
            validatedValue = String(value);
        }
        
        // 特殊验证
        if (key === 'borrow_days' && typeof validatedValue === 'number' && validatedValue <= 0) {
          errors.push('借阅天数必须大于0');
          continue;
        }
        
        if (key === 'max_borrow_books' && typeof validatedValue === 'number' && validatedValue <= 0) {
          errors.push('最大借阅数量必须大于0');
          continue;
        }
        
        updates.push({ key, value: String(validatedValue) });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`设置项 ${key} 验证失败: ${errorMessage}`);
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '设置验证失败', 
        errors 
      });
    }
    
    // 执行批量更新
    const sql = `
      UPDATE settings 
      SET value = ?, updated_at = datetime('now')
      WHERE key = ?
    `;
    
    updates.forEach(({ key, value }) => {
      database.run(sql, [value, key]);
    });
    
    res.json({ 
      success: true, 
      message: `成功更新 ${updates.length} 个设置项` 
    });
  } catch (error) {
    console.error('批量更新设置失败:', error);
    res.status(500).json({ success: false, message: '批量更新设置失败' });
  }
});

// 重置设置为默认值
router.post('/reset', async (req, res) => {
  try {
    const { keys } = req.body;
    
    // 默认设置值
    const defaultSettings = {
      'borrow_days': '30',
      'max_borrow_books': '5',
      'enable_overdue_reminder': 'true',
      'library_name': '图书管理系统',
      'admin_email': 'admin@library.com'
    };
    
    if (keys && Array.isArray(keys)) {
      // 重置指定的设置项
      const sql = `
        UPDATE settings 
        SET value = ?, updated_at = datetime('now')
        WHERE key = ?
      `;
      
      let resetCount = 0;
      keys.forEach(key => {
        if (defaultSettings[key]) {
          database.run(sql, [defaultSettings[key], key]);
          resetCount++;
        }
      });
      
      res.json({ 
        success: true, 
        message: `成功重置 ${resetCount} 个设置项` 
      });
    } else {
      // 重置所有设置项
      const sql = `
        UPDATE settings 
        SET value = ?, updated_at = datetime('now')
        WHERE key = ?
      `;
      
      Object.entries(defaultSettings).forEach(([key, value]) => {
        database.run(sql, [value, key]);
      });
      
      res.json({ 
        success: true, 
        message: '所有设置已重置为默认值' 
      });
    }
  } catch (error) {
    console.error('重置设置失败:', error);
    res.status(500).json({ success: false, message: '重置设置失败' });
  }
});

// 获取系统信息
router.get('/system/info', async (req, res) => {
  try {
    // 获取统计信息
    const totalBooks = database.query('SELECT COUNT(*) as count FROM books');
    const availableBooks = database.query('SELECT COUNT(*) as count FROM books WHERE status = "available"');
    const borrowedBooks = database.query('SELECT COUNT(*) as count FROM books WHERE status = "borrowed"');
    const totalBorrows = database.query('SELECT COUNT(*) as count FROM borrows');
    const activeBorrows = database.query('SELECT COUNT(*) as count FROM borrows WHERE status = "borrowed"');
    const overdueBooks = database.query(`
      SELECT COUNT(*) as count FROM borrows 
      WHERE status = 'borrowed' AND due_date < date('now')
    `);
    
    // 获取分类数量
    const totalCategories = database.query('SELECT COUNT(*) as count FROM categories');
    
    res.json({
      success: true,
      data: {
        books: {
          total: totalBooks.count || 0,
          available: availableBooks.count || 0,
          borrowed: borrowedBooks.count || 0
        },
        borrows: {
          total: totalBorrows.count || 0,
          active: activeBorrows.count || 0,
          overdue: overdueBooks.count || 0
        },
        categories: {
          total: totalCategories.count || 0
        },
        system: {
          version: '1.0.0',
          database: 'SQLite',
          uptime: process.uptime()
        }
      }
    });
  } catch (error) {
    console.error('获取系统信息失败:', error);
    res.status(500).json({ success: false, message: '获取系统信息失败' });
  }
});

export default router;