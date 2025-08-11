import database from './api/database/database.ts';

async function checkDatabase() {
    try {
        await database.init();
        
        console.log('检查settings表结构...');
        
        // 检查settings表结构
        const tableInfo = database.queryAll("PRAGMA table_info(settings)");
        
        console.log('\nsettings表字段:');
        tableInfo.forEach(row => {
            console.log(`- ${row.name}: ${row.type} (nullable: ${row.notnull === 0})`);
        });
        
        // 检查是否有type字段
        const hasTypeField = tableInfo.some(row => row.name === 'type');
        console.log(`\ntype字段存在: ${hasTypeField}`);
        
        // 检查settings数据
        const settings = database.queryAll("SELECT * FROM settings");
        
        console.log('\n当前settings数据:');
        settings.forEach(setting => {
            console.log(`- ${setting.key}: ${setting.value} (type: ${setting.type || 'undefined'})`);
        });
        
        // 检查是否有max_borrow_books设置
        const hasMaxBorrowBooks = settings.some(s => s.key === 'max_borrow_books');
        console.log(`\nmax_borrow_books设置存在: ${hasMaxBorrowBooks}`);
        
        database.close();
    } catch (error) {
        console.error('检查数据库失败:', error);
    }
}

checkDatabase();