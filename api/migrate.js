import database from './database/database.ts';

async function migrate() {
  try {
    console.log('开始数据库迁移...');
    
    // 初始化数据库连接
    await database.init();
    
    // 添加联系方式和备注字段到借阅表
    database.run('ALTER TABLE borrows ADD COLUMN contact VARCHAR(100) DEFAULT ""');
    console.log('添加contact字段成功');
    
    database.run('ALTER TABLE borrows ADD COLUMN notes TEXT DEFAULT ""');
    console.log('添加notes字段成功');
    
    console.log('数据库迁移完成！');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('字段已存在，跳过迁移');
    } else {
      console.error('数据库迁移失败:', error);
    }
  }
}

migrate();