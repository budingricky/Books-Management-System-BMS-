/**
 * 图书管理系统 - 综合API功能测试脚本
 * 测试所有API接口的功能和响应
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api`;

// 测试结果收集
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// 测试辅助函数
function logTest(testName, success, details = '') {
  if (success) {
    console.log(`✅ ${testName}`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName} - ${details}`);
    testResults.failed++;
    testResults.errors.push({ test: testName, error: details });
  }
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. 测试健康检查接口
async function testHealthCheck() {
  console.log('\n🔍 测试健康检查接口...');
  try {
    const response = await axios.get(`${API_BASE}/health`);
    logTest('健康检查接口', response.status === 200 && response.data.success);
    console.log('   响应:', response.data);
  } catch (error) {
    logTest('健康检查接口', false, error.message);
  }
}

// 2. 测试分类管理接口
async function testCategories() {
  console.log('\n📚 测试分类管理接口...');
  
  try {
    // 获取所有分类
    const getResponse = await axios.get(`${API_BASE}/categories`);
    logTest('获取分类列表', getResponse.status === 200);
    console.log('   分类数量:', getResponse.data.data?.length || 0);
    
    // 添加新分类
    const newCategory = {
      name: '测试分类',
      code: 'TEST_' + Date.now(),
      parentId: null
    };
    
    const addResponse = await axios.post(`${API_BASE}/categories`, newCategory);
    logTest('添加新分类', addResponse.status === 200 || addResponse.status === 201);
    
    if (addResponse.data.success && addResponse.data.data?.id) {
      const categoryId = addResponse.data.data.id;
      
      // 更新分类
      const updateData = { 
        name: '更新测试分类',
        code: 'TEST_UPDATED_' + Date.now()
      };
      const updateResponse = await axios.put(`${API_BASE}/categories/${categoryId}`, updateData);
      logTest('更新分类', updateResponse.status === 200);
      
      // 删除分类
      const deleteResponse = await axios.delete(`${API_BASE}/categories/${categoryId}`);
      logTest('删除分类', deleteResponse.status === 200);
    }
    
  } catch (error) {
    logTest('分类管理接口', false, error.message);
  }
}

// 3. 测试图书管理接口
async function testBooks() {
  console.log('\n📖 测试图书管理接口...');
  
  try {
    // 获取图书列表
    const getResponse = await axios.get(`${API_BASE}/books`);
    logTest('获取图书列表', getResponse.status === 200);
    console.log('   图书数量:', getResponse.data.data?.length || 0);
    
    // 搜索图书
    const searchResponse = await axios.get(`${API_BASE}/books/search?keyword=测试`);
    logTest('搜索图书', searchResponse.status === 200);
    
    // 添加新图书
    const newBook = {
      isbn: '9787111111111' + Date.now().toString().slice(-3),
      title: '测试图书',
      author: '测试作者',
      publisher: '测试出版社',
      category_id: 1,
      room: '测试房间',
      shelf: 'A1',
      row: '1',
      column: '1',
      number: '001'
    };
    
    const addResponse = await axios.post(`${API_BASE}/books`, newBook);
    logTest('添加新图书', addResponse.status === 200 || addResponse.status === 201);
    
    if (addResponse.data.success && addResponse.data.data?.id) {
      const bookId = addResponse.data.data.id;
      
      // 获取图书详情
      const detailResponse = await axios.get(`${API_BASE}/books/${bookId}`);
      logTest('获取图书详情', detailResponse.status === 200);
      
      // 更新图书
      const updateData = { title: '更新测试图书' };
      const updateResponse = await axios.put(`${API_BASE}/books/${bookId}`, updateData);
      logTest('更新图书', updateResponse.status === 200);
      
      // 删除图书
      const deleteResponse = await axios.delete(`${API_BASE}/books/${bookId}`);
      logTest('删除图书', deleteResponse.status === 200);
    }
    
  } catch (error) {
    logTest('图书管理接口', false, error.message);
  }
}

// 4. 测试借阅管理接口
async function testBorrows() {
  console.log('\n📋 测试借阅管理接口...');
  
  try {
    // 获取借阅记录
    const getResponse = await axios.get(`${API_BASE}/borrows`);
    logTest('获取借阅记录', getResponse.status === 200);
    console.log('   借阅记录数量:', getResponse.data.data?.length || 0);
    
    // 先添加一本测试图书用于借阅
    const testBook = {
      isbn: '9787222222222' + Date.now().toString().slice(-3),
      title: '借阅测试图书',
      author: '测试作者',
      category_id: 1,
      room: '测试房间',
      shelf: 'B1',
      row: '1',
      column: '1',
      number: '002'
    };
    
    const bookResponse = await axios.post(`${API_BASE}/books`, testBook);
    
    if (bookResponse.data.success && bookResponse.data.data?.id) {
      const bookId = bookResponse.data.data.id;
      
      // 创建借阅记录
      const borrowData = {
        bookId: bookId,
        borrower: '测试借阅者',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30天后，只要日期部分
      };
      
      const borrowResponse = await axios.post(`${API_BASE}/borrows`, borrowData);
      logTest('创建借阅记录', borrowResponse.status === 200 || borrowResponse.status === 201);
      
      if (borrowResponse.data.success && borrowResponse.data.data?.id) {
        const borrowId = borrowResponse.data.data.id;
        
        // 归还图书
        const returnResponse = await axios.put(`${API_BASE}/borrows/${borrowId}/return`);
        logTest('归还图书', returnResponse.status === 200);
      }
      
      // 清理测试图书
      await axios.delete(`${API_BASE}/books/${bookId}`);
    }
    
  } catch (error) {
    logTest('借阅管理接口', false, error.message);
  }
}

// 5. 测试统计接口
async function testStatistics() {
  console.log('\n📊 测试统计接口...');
  
  try {
    const response = await axios.get(`${API_BASE}/statistics/overview`);
    logTest('获取统计数据', response.status === 200);
    
    if (response.data.success) {
      const stats = response.data.data;
      console.log('   统计数据:');
      console.log(`     总图书数: ${stats.totalBooks || 0}`);
      console.log(`     已借阅数: ${stats.borrowedBooks || 0}`);
      console.log(`     可借阅数: ${stats.availableBooks || 0}`);
    }
    
  } catch (error) {
    logTest('统计接口', false, error.message);
  }
}

// 6. 测试ISBN接口
async function testISBN() {
  console.log('\n🔍 测试ISBN接口...');
  
  try {
    // 测试一个常见的ISBN
    const isbn = '9787111213826';
    const response = await axios.get(`${API_BASE}/isbn/${isbn}`);
    logTest('ISBN信息查询', response.status === 200);
    
    if (response.data.success) {
      console.log('   ISBN查询结果:', response.data.data?.title || '未找到图书信息');
    }
    
  } catch (error) {
    logTest('ISBN接口', false, error.message);
  }
}

// 7. 测试设置接口
async function testSettings() {
  console.log('\n⚙️ 测试设置接口...');
  
  try {
    // 获取设置
    const getResponse = await axios.get(`${API_BASE}/settings`);
    logTest('获取系统设置', getResponse.status === 200);
    
    // 更新设置 - 使用PUT方法更新现有设置
    const updateData = {
      value: '30',
      description: '默认借阅天数'
    };
    
    const updateResponse = await axios.put(`${API_BASE}/settings/default_borrow_days`, updateData);
    logTest('更新系统设置', updateResponse.status === 200);
    
  } catch (error) {
    logTest('设置接口', false, error.message);
  }
}

// 8. 测试导出接口
async function testExport() {
  console.log('\n📤 测试导出接口...');
  
  try {
    const response = await axios.get(`${API_BASE}/export/books`);
    logTest('导出图书数据', response.status === 200);
    
  } catch (error) {
    logTest('导出接口', false, error.message);
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始图书管理系统API功能测试...');
  console.log('=' .repeat(50));
  
  await testHealthCheck();
  await delay(500);
  
  await testCategories();
  await delay(500);
  
  await testBooks();
  await delay(500);
  
  await testBorrows();
  await delay(500);
  
  await testStatistics();
  await delay(500);
  
  await testISBN();
  await delay(500);
  
  await testSettings();
  await delay(500);
  
  await testExport();
  
  // 输出测试结果
  console.log('\n' + '=' .repeat(50));
  console.log('📋 测试结果汇总:');
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📊 成功率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.errors.forEach(error => {
      console.log(`   - ${error.test}: ${error.error}`);
    });
  }
  
  console.log('\n🎉 API功能测试完成!');
}

// 运行测试
runAllTests().catch(console.error);

export { runAllTests, testResults };