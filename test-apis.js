// API测试脚本
const BASE_URL = 'http://localhost:5173/api';

// 测试工具函数
async function testAPI(method, url, data = null, description = '') {
  console.log(`\n🧪 测试: ${description}`);
  console.log(`${method} ${url}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ 成功:', result);
      return result;
    } else {
      console.log('❌ 失败:', result);
      return null;
    }
  } catch (error) {
    console.log('❌ 错误:', error.message);
    return null;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始API功能测试\n');
  
  // 1. 测试分类API
  console.log('\n📚 测试分类相关API');
  await testAPI('GET', `${BASE_URL}/categories`, null, '获取所有分类');
  await testAPI('GET', `${BASE_URL}/categories?tree=true`, null, '获取分类树形结构');
  
  // 2. 测试图书API
  console.log('\n📖 测试图书相关API');
  await testAPI('GET', `${BASE_URL}/books`, null, '获取图书列表');
  await testAPI('GET', `${BASE_URL}/books?page=1&limit=5`, null, '分页获取图书');
  
  // 测试添加图书
  const newBook = {
    isbn: '9787111111111',
    title: '测试图书',
    author: '测试作者',
    publisher: '测试出版社',
    publishDate: '2024-01-01',
    categoryId: 1,
    coverUrl: '',
    description: '这是一本测试图书',
    room: 'A区',
    shelf: '001',
    row: '1',
    column: '1',
    number: '001',
    status: 'available',
    price: 29.99
  };
  
  const addResult = await testAPI('POST', `${BASE_URL}/books`, newBook, '添加新图书');
  
  if (addResult && addResult.data && addResult.data.id) {
    const bookId = addResult.data.id;
    
    // 测试获取单本图书
    await testAPI('GET', `${BASE_URL}/books/${bookId}`, null, '获取单本图书详情');
    
    // 测试更新图书
    const updateData = {
      ...newBook,
      title: '更新后的测试图书',
      description: '这是更新后的测试图书描述'
    };
    await testAPI('PUT', `${BASE_URL}/books/${bookId}`, updateData, '更新图书信息');
    
    // 测试借阅相关API
    console.log('\n📋 测试借阅相关API');
    
    // 测试借阅图书
    const borrowData = {
      borrower: '测试用户',
      dueDate: '2024-02-01'
    };
    const borrowResult = await testAPI('POST', `${BASE_URL}/borrows`, {
      bookId: bookId,
      ...borrowData
    }, '借阅图书');
    
    // 测试获取借阅记录
    await testAPI('GET', `${BASE_URL}/borrows`, null, '获取所有借阅记录');
    await testAPI('GET', `${BASE_URL}/borrows/book/${bookId}`, null, '获取指定图书的借阅记录');
    
    // 获取借阅记录ID
    const borrowsResult = await testAPI('GET', `${BASE_URL}/borrows`, null, '获取借阅记录以找到ID');
    if (borrowsResult && borrowsResult.data && borrowsResult.data.borrows && borrowsResult.data.borrows.length > 0) {
      const borrowId = borrowsResult.data.borrows[0].id;
      
      // 测试归还图书
      await testAPI('PUT', `${BASE_URL}/borrows/${borrowId}/return`, null, '归还图书');
    }
    
    // 测试删除图书（最后执行）
    await testAPI('DELETE', `${BASE_URL}/books/${bookId}`, null, '删除测试图书');
  }
  
  // 3. 测试统计API
  console.log('\n📊 测试统计相关API');
  await testAPI('GET', `${BASE_URL}/statistics/overview`, null, '获取概览统计');
  await testAPI('GET', `${BASE_URL}/statistics/monthly-stats`, null, '获取月度统计');
  await testAPI('GET', `${BASE_URL}/borrows/recent-activities`, null, '获取最近活动');
  
  // 4. 测试搜索功能
  console.log('\n🔍 测试搜索功能');
  await testAPI('GET', `${BASE_URL}/books?search=测试`, null, '搜索图书');
  await testAPI('GET', `${BASE_URL}/books?category=1`, null, '按分类筛选图书');
  
  console.log('\n🎉 API测试完成!');
}

// 运行测试
runTests().catch(console.error);