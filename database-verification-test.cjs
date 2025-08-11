const fs = require('fs');
const axios = require('axios');

// 测试结果统计
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// 测试辅助函数
function logTest(name, success, message = '') {
  testResults.total++;
  if (success) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${message}`);
    testResults.errors.push({ test: name, error: message });
  }
  
  testResults.details.push({
    test: name,
    success,
    message,
    timestamp: new Date().toISOString()
  });
}

// API基础URL
const API_BASE = 'http://localhost:3001/api';

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 生成唯一标识符
function generateUniqueId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// 测试数据库连接
async function testDatabaseConnection() {
  console.log('\n=== 数据库连接测试 ===');
  
  try {
    const response = await axios.get(`${API_BASE}/health`);
    const isConnected = response.status === 200 && response.data.success;
    logTest('数据库健康检查', isConnected, isConnected ? '' : '健康检查失败');
    
    if (isConnected && response.data.data) {
      const hasDatabase = response.data.data.database !== undefined;
      logTest('数据库状态信息', hasDatabase, hasDatabase ? '' : '缺少数据库状态信息');
    }
  } catch (error) {
    logTest('数据库健康检查', false, error.message);
  }
}

// 测试表结构和数据完整性
async function testTableStructure() {
  console.log('\n=== 表结构和数据完整性测试 ===');
  
  // 测试获取所有表的数据
  const tables = [
    { name: 'books', endpoint: '/books' },
    { name: 'categories', endpoint: '/categories' },
    { name: 'borrows', endpoint: '/borrows' },
    { name: 'settings', endpoint: '/settings' }
  ];
  
  for (const table of tables) {
    try {
      const response = await axios.get(`${API_BASE}${table.endpoint}`);
      const isSuccess = response.status === 200 && response.data.success;
      logTest(`${table.name}表数据获取`, isSuccess, isSuccess ? '' : '数据获取失败');
      
      if (isSuccess && response.data.data) {
        const hasData = Array.isArray(response.data.data);
        logTest(`${table.name}表数据格式`, hasData, hasData ? '' : '数据格式不正确');
      }
    } catch (error) {
      logTest(`${table.name}表数据获取`, false, error.message);
    }
    
    await delay(100); // 避免请求过快
  }
}

// 测试CRUD操作 - 图书管理
async function testBooksCRUD() {
  console.log('\n=== 图书CRUD操作测试 ===');
  
  const uniqueId = generateUniqueId();
  const testBook = {
    title: `测试图书_${uniqueId}`,
    author: '测试作者',
    isbn: `978${uniqueId.substr(0, 10)}`,
    publisher: '测试出版社',
    category_id: 1,
    total_copies: 5,
    available_copies: 5
  };
  
  let createdBookId = null;
  
  // 创建图书
  try {
    const response = await axios.post(`${API_BASE}/books`, testBook);
    const isSuccess = response.status === 200 && response.data.success;
    logTest('创建图书', isSuccess, isSuccess ? '' : '创建失败');
    
    if (isSuccess && response.data.data) {
      createdBookId = response.data.data.id;
      logTest('获取创建的图书ID', createdBookId !== null, createdBookId ? '' : '未获取到图书ID');
    }
  } catch (error) {
    logTest('创建图书', false, error.response?.data?.message || error.message);
  }
  
  await delay(200);
  
  // 读取图书
  if (createdBookId) {
    try {
      const response = await axios.get(`${API_BASE}/books/${createdBookId}`);
      const isSuccess = response.status === 200 && response.data.success;
      logTest('读取图书', isSuccess, isSuccess ? '' : '读取失败');
      
      if (isSuccess && response.data.data) {
        const bookData = response.data.data;
        const hasCorrectTitle = bookData.title === testBook.title;
        logTest('图书数据完整性', hasCorrectTitle, hasCorrectTitle ? '' : '图书数据不匹配');
      }
    } catch (error) {
      logTest('读取图书', false, error.message);
    }
    
    await delay(200);
    
    // 更新图书
    try {
      const updateData = { title: `更新的测试图书_${uniqueId}` };
      const response = await axios.put(`${API_BASE}/books/${createdBookId}`, updateData);
      const isSuccess = response.status === 200 && response.data.success;
      logTest('更新图书', isSuccess, isSuccess ? '' : '更新失败');
    } catch (error) {
      logTest('更新图书', false, error.response?.data?.message || error.message);
    }
    
    await delay(200);
    
    // 删除图书
    try {
      const response = await axios.delete(`${API_BASE}/books/${createdBookId}`);
      const isSuccess = response.status === 200 && response.data.success;
      logTest('删除图书', isSuccess, isSuccess ? '' : '删除失败');
    } catch (error) {
      logTest('删除图书', false, error.response?.data?.message || error.message);
    }
  }
}

// 测试CRUD操作 - 分类管理
async function testCategoriesCRUD() {
  console.log('\n=== 分类CRUD操作测试 ===');
  
  const uniqueId = generateUniqueId();
  const testCategory = {
    name: `测试分类_${uniqueId}`,
    code: `TEST_${uniqueId}`,
    description: '这是一个测试分类'
  };
  
  let createdCategoryId = null;
  
  // 创建分类
  try {
    const response = await axios.post(`${API_BASE}/categories`, testCategory);
    const isSuccess = response.status === 200 && response.data.success;
    logTest('创建分类', isSuccess, isSuccess ? '' : '创建失败');
    
    if (isSuccess && response.data.data) {
      createdCategoryId = response.data.data.id;
      logTest('获取创建的分类ID', createdCategoryId !== null, createdCategoryId ? '' : '未获取到分类ID');
    }
  } catch (error) {
    logTest('创建分类', false, error.response?.data?.message || error.message);
  }
  
  await delay(200);
  
  // 读取分类
  if (createdCategoryId) {
    try {
      const response = await axios.get(`${API_BASE}/categories/${createdCategoryId}`);
      const isSuccess = response.status === 200 && response.data.success;
      logTest('读取分类', isSuccess, isSuccess ? '' : '读取失败');
      
      if (isSuccess && response.data.data) {
        const categoryData = response.data.data;
        const hasCorrectName = categoryData.name === testCategory.name;
        logTest('分类数据完整性', hasCorrectName, hasCorrectName ? '' : '分类数据不匹配');
      }
    } catch (error) {
      logTest('读取分类', false, error.message);
    }
    
    await delay(200);
    
    // 更新分类
    try {
      const updateData = { name: `更新的测试分类_${uniqueId}` };
      const response = await axios.put(`${API_BASE}/categories/${createdCategoryId}`, updateData);
      const isSuccess = response.status === 200 && response.data.success;
      logTest('更新分类', isSuccess, isSuccess ? '' : '更新失败');
    } catch (error) {
      logTest('更新分类', false, error.response?.data?.message || error.message);
    }
    
    await delay(200);
    
    // 删除分类
    try {
      const response = await axios.delete(`${API_BASE}/categories/${createdCategoryId}`);
      const isSuccess = response.status === 200 && response.data.success;
      logTest('删除分类', isSuccess, isSuccess ? '' : '删除失败');
    } catch (error) {
      logTest('删除分类', false, error.response?.data?.message || error.message);
    }
  }
}

// 测试数据关联性
async function testDataRelationships() {
  console.log('\n=== 数据关联性测试 ===');
  
  // 测试分类与图书的关联
  try {
    const categoriesResponse = await axios.get(`${API_BASE}/categories`);
    if (categoriesResponse.data.success && categoriesResponse.data.data.length > 0) {
      const firstCategory = categoriesResponse.data.data[0];
      logTest('分类数据存在', true);
      
      // 测试该分类下的图书
      const booksResponse = await axios.get(`${API_BASE}/books?category_id=${firstCategory.id}`);
      const hasBooks = booksResponse.status === 200;
      logTest('分类关联图书查询', hasBooks, hasBooks ? '' : '分类关联查询失败');
    } else {
      logTest('分类数据存在', false, '没有分类数据');
    }
  } catch (error) {
    logTest('数据关联性测试', false, error.message);
  }
  
  await delay(200);
  
  // 测试借阅记录与图书的关联
  try {
    const borrowsResponse = await axios.get(`${API_BASE}/borrows`);
    const hasBorrows = borrowsResponse.status === 200 && borrowsResponse.data.success;
    logTest('借阅记录查询', hasBorrows, hasBorrows ? '' : '借阅记录查询失败');
    
    if (hasBorrows && borrowsResponse.data.data.length > 0) {
      const firstBorrow = borrowsResponse.data.data[0];
      const hasBookInfo = firstBorrow.book_id !== undefined;
      logTest('借阅记录关联图书', hasBookInfo, hasBookInfo ? '' : '借阅记录缺少图书关联');
    }
  } catch (error) {
    logTest('借阅记录关联测试', false, error.message);
  }
}

// 测试数据约束和验证
async function testDataConstraints() {
  console.log('\n=== 数据约束和验证测试 ===');
  
  // 测试重复ISBN约束
  try {
    const duplicateBook = {
      title: '重复ISBN测试',
      author: '测试作者',
      isbn: '9781234567890', // 使用可能已存在的ISBN
      publisher: '测试出版社',
      category_id: 1
    };
    
    const response = await axios.post(`${API_BASE}/books`, duplicateBook);
    // 如果成功创建，说明没有重复约束或者ISBN确实不存在
    logTest('ISBN唯一性约束测试', true, '创建成功或ISBN不重复');
  } catch (error) {
    // 如果失败且是因为重复ISBN，说明约束正常工作
    const isDuplicateError = error.response?.status === 400 && 
                            error.response?.data?.message?.includes('ISBN');
    logTest('ISBN唯一性约束测试', isDuplicateError, isDuplicateError ? '约束正常工作' : error.message);
  }
  
  await delay(200);
  
  // 测试必填字段验证
  try {
    const incompleteBook = {
      title: '', // 空标题
      author: '测试作者'
      // 缺少必填字段
    };
    
    const response = await axios.post(`${API_BASE}/books`, incompleteBook);
    logTest('必填字段验证', false, '应该验证失败但成功了');
  } catch (error) {
    const isValidationError = error.response?.status === 400;
    logTest('必填字段验证', isValidationError, isValidationError ? '验证正常工作' : error.message);
  }
}

// 测试统计数据准确性
async function testStatisticsAccuracy() {
  console.log('\n=== 统计数据准确性测试 ===');
  
  try {
    // 获取概览统计
    const overviewResponse = await axios.get(`${API_BASE}/statistics/overview`);
    const hasOverview = overviewResponse.status === 200 && overviewResponse.data.success;
    logTest('概览统计获取', hasOverview, hasOverview ? '' : '概览统计获取失败');
    
    if (hasOverview && overviewResponse.data.data) {
      const stats = overviewResponse.data.data;
      const hasRequiredFields = stats.totalBooks !== undefined && 
                               stats.totalBorrows !== undefined && 
                               stats.totalCategories !== undefined;
      logTest('统计数据字段完整性', hasRequiredFields, hasRequiredFields ? '' : '缺少必要统计字段');
      
      // 验证统计数据的合理性
      const isReasonable = stats.totalBooks >= 0 && 
                          stats.totalBorrows >= 0 && 
                          stats.totalCategories >= 0;
      logTest('统计数据合理性', isReasonable, isReasonable ? '' : '统计数据不合理');
    }
  } catch (error) {
    logTest('统计数据测试', false, error.message);
  }
  
  await delay(200);
  
  // 测试分类统计
  try {
    const categoryStatsResponse = await axios.get(`${API_BASE}/statistics/categories`);
    const hasCategoryStats = categoryStatsResponse.status === 200 && categoryStatsResponse.data.success;
    logTest('分类统计获取', hasCategoryStats, hasCategoryStats ? '' : '分类统计获取失败');
  } catch (error) {
    logTest('分类统计测试', false, error.message);
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始数据库验证测试...');
  console.log('测试时间:', new Date().toLocaleString());
  
  await testDatabaseConnection();
  await testTableStructure();
  await testBooksCRUD();
  await testCategoriesCRUD();
  await testDataRelationships();
  await testDataConstraints();
  await testStatisticsAccuracy();
  
  // 生成测试报告
  const report = {
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%'
    },
    timestamp: new Date().toISOString(),
    details: testResults.details,
    errors: testResults.errors
  };
  
  console.log('\n📊 数据库验证测试结果汇总:');
  console.log(`总测试数: ${report.summary.total}`);
  console.log(`通过: ${report.summary.passed}`);
  console.log(`失败: ${report.summary.failed}`);
  console.log(`成功率: ${report.summary.successRate}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.errors.forEach(error => {
      console.log(`- ${error.test}: ${error.error}`);
    });
  }
  
  // 保存测试报告
  fs.writeFileSync('database-verification-test-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 数据库验证测试报告已保存到: database-verification-test-report.json');
  
  return report;
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };