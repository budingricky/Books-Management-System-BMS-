const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// 测试结果统计
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// 测试函数
async function testAPI(name, method, url, data = null, expectedStatus = 200) {
  totalTests++;
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      timeout: 5000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      console.log(`${colors.green}✓${colors.reset} ${name} - 状态码: ${response.status}`);
      passedTests++;
      return response.data;
    } else {
      console.log(`${colors.red}✗${colors.reset} ${name} - 期望状态码: ${expectedStatus}, 实际: ${response.status}`);
      failedTests++;
      return null;
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${name} - 错误: ${error.message}`);
    failedTests++;
    return null;
  }
}

// 主测试函数
async function runAllTests() {
  console.log(`${colors.blue}开始全面API测试...${colors.reset}\n`);
  
  // 1. 图书管理API测试
  console.log(`${colors.yellow}=== 图书管理API测试 ===${colors.reset}`);
  
  // 获取图书列表
  await testAPI('获取图书列表', 'GET', '/api/books?page=1&limit=10');
  
  // 搜索图书
  await testAPI('搜索图书', 'GET', '/api/books/search?q=测试');
  
  // 添加图书 - 使用随机ISBN避免重复
  const randomISBN = `978${Math.floor(Math.random() * 1000000000)}`;
  const newBook = {
    title: '测试图书',
    author: '测试作者',
    isbn: randomISBN,
    category_id: 1,
    publisher: '测试出版社',
    publish_date: '2024-01-01',
    room: '101',
    shelf: 'A',
    row: '1',
    column: '1',
    number: '001',
    price: 29.99,
    status: 'available'
  };
  
  const addedBook = await testAPI('添加图书', 'POST', '/api/books', newBook, 201);
  let bookId = null;
  if (addedBook && addedBook.id) {
    bookId = addedBook.id;
  }
  
  // 获取单本图书详情
  if (bookId) {
    await testAPI('获取图书详情', 'GET', `/api/books/${bookId}`);
    
    // 更新图书
    const updateData = {
      title: '更新后的测试图书',
      author: '更新后的作者'
    };
    await testAPI('更新图书', 'PUT', `/api/books/${bookId}`, updateData);
  }
  
  // ISBN查询 - 使用真实存在的ISBN
  await testAPI('ISBN查询', 'GET', '/api/isbn/9787121177408');
  
  // 2. 分类管理API测试
  console.log(`\n${colors.yellow}=== 分类管理API测试 ===${colors.reset}`);
  
  // 获取分类列表
  await testAPI('获取分类列表', 'GET', '/api/categories');
  
  // 添加分类 - 使用随机编码避免重复
  const randomCode = `TEST_${Math.floor(Math.random() * 10000)}`;
  const newCategory = {
    name: '测试分类',
    code: randomCode
  };
  
  const addedCategory = await testAPI('添加分类', 'POST', '/api/categories', newCategory, 201);
  let categoryId = null;
  if (addedCategory && addedCategory.id) {
    categoryId = addedCategory.id;
  }
  
  // 更新分类
  if (categoryId) {
    const updateCategoryData = {
      name: '更新后的测试分类',
      code: 'TEST_CAT_UPDATED'
    };
    await testAPI('更新分类', 'PUT', `/api/categories/${categoryId}`, updateCategoryData);
  }
  
  // 3. 借阅管理API测试
  console.log(`\n${colors.yellow}=== 借阅管理API测试 ===${colors.reset}`);
  
  // 获取借阅记录
  await testAPI('获取借阅记录', 'GET', '/api/borrows?page=1&limit=10');
  
  // 获取即将到期的借阅
  await testAPI('获取即将到期借阅', 'GET', '/api/borrows/due-soon?days=7');
  
  // 获取最近活动
  await testAPI('获取最近活动', 'GET', '/api/borrows/recent-activities?limit=5');
  
  // 借出图书
  if (bookId) {
    const borrowData = {
      book_id: bookId,
      borrower_name: '测试借阅者',
      borrower_contact: '13800138000',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    const borrowRecord = await testAPI('借出图书', 'POST', '/api/borrows', borrowData, 201);
    
    if (borrowRecord && borrowRecord.id) {
      const borrowId = borrowRecord.id;
      
      // 续借
      const renewData = {
        new_due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      await testAPI('续借图书', 'PUT', `/api/borrows/${borrowId}/renew`, renewData);
      
      // 归还图书
      await testAPI('归还图书', 'PUT', `/api/borrows/${borrowId}/return`);
    }
  }
  
  // 4. 统计分析API测试
  console.log(`\n${colors.yellow}=== 统计分析API测试 ===${colors.reset}`);
  
  // 概览统计
  await testAPI('获取概览统计', 'GET', '/api/statistics/overview');
  
  // 月度统计
  await testAPI('获取月度统计', 'GET', '/api/statistics/monthly-stats');
  
  // 分类统计
  await testAPI('获取分类统计', 'GET', '/api/statistics/books-by-category');
  
  // 热门图书
  await testAPI('获取热门图书', 'GET', '/api/statistics/popular-books?limit=10');
  
  // 活跃借阅者
  await testAPI('获取活跃借阅者', 'GET', '/api/statistics/active-borrowers?limit=10');
  
  // 逾期分析
  await testAPI('获取逾期分析', 'GET', '/api/statistics/overdue-analysis');
  
  // 借阅趋势
  await testAPI('获取借阅趋势', 'GET', '/api/statistics/borrow-trend?days=30');
  
  // 5. 系统设置API测试
  console.log(`\n${colors.yellow}=== 系统设置API测试 ===${colors.reset}`);
  
  // 获取系统设置
  await testAPI('获取系统设置', 'GET', '/api/settings');
  
  // 更新系统设置
  const settingsData = {
    settings: {
      system_name: '测试图书馆',
      default_borrow_days: '30'
    }
  };
  await testAPI('更新系统设置', 'PUT', '/api/settings', settingsData);
  
  // 清理测试数据
  console.log(`\n${colors.yellow}=== 清理测试数据 ===${colors.reset}`);
  
  if (bookId) {
    await testAPI('删除测试图书', 'DELETE', `/api/books/${bookId}`);
  }
  
  if (categoryId) {
    await testAPI('删除测试分类', 'DELETE', `/api/categories/${categoryId}`);
  }
  
  // 输出测试结果
  console.log(`\n${colors.blue}=== 测试结果汇总 ===${colors.reset}`);
  console.log(`总测试数: ${totalTests}`);
  console.log(`${colors.green}通过: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}失败: ${failedTests}${colors.reset}`);
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
  
  if (failedTests === 0) {
    console.log(`\n${colors.green}🎉 所有API测试通过！${colors.reset}`);
  } else {
    console.log(`\n${colors.red}⚠️  有 ${failedTests} 个API测试失败，请检查相关功能。${colors.reset}`);
  }
}

// 运行测试
runAllTests().catch(error => {
  console.error(`${colors.red}测试运行出错:${colors.reset}`, error.message);
  process.exit(1);
});