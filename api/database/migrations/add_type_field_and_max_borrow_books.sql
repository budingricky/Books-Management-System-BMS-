-- 添加type字段到settings表
ALTER TABLE settings ADD COLUMN type VARCHAR(50) DEFAULT 'string';

-- 更新现有记录的type字段
UPDATE settings SET type = 'string' WHERE key IN ('isbn_api_key', 'system_name');
UPDATE settings SET type = 'number' WHERE key IN ('default_borrow_days', 'reminder_hours');

-- 添加max_borrow_books设置项
INSERT OR IGNORE INTO settings (key, value, type, description) VALUES
('max_borrow_books', '5', 'number', '最大借阅图书数量');