/**
 * 图书管理系统 - 最终综合测试脚本
 * 验证所有修复后的功能
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api`;

// 测试结果收集
const testResults = {
  apiTests: { passed: 0, failed: 0, errors: [] },
  frontendTests: { passed: 0, failed: 0, errors: [] },
  databaseTests: { passed: 0, failed: 0, errors: [] },
  overallTests: { passed: 0, failed: 0, errors: [] }
};

// 测试辅助函数
function logTest(category, testName, success, details = '') {
  const result = testResults[category];
  if (success) {
    console.log(`✅ ${testName}`);
    result.passed++;
  } else {
    console.log(`❌ ${testName} - ${details}`);
    result.failed++;
    result.errors.push({ test: testName, error: details });
  }
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. API接口测试
async function testAPIs() {
  console.log('\n🔍 API接口测试...');
  
  try {
    // 健康检查
    const healthResponse = await axios.get(`${API_BASE}/health`);
    logTest('apiTests', '健康检查接口', healthResponse.status === 200);
    
    // 分类管理
    const categoriesResponse = await axios.get(`${API_BASE}/categories`);
    logTest('apiTests', '获取分类列表', categoriesResponse.status === 200);
    
    // 图书管理
    const booksResponse = await axios.get(`${API_BASE}/books`);
    logTest('apiTests', '获取图书列表', booksResponse.status === 200);
    
    // 借阅管理
    const borrowsResponse = await axios.get(`${API_BASE}/borrows`);
    logTest('apiTests', '获取借阅记录', borrowsResponse.status === 200);
    
    // 统计接口
    const statsResponse = await axios.get(`${API_BASE}/statistics/overview`);
    logTest('apiTests', '获取统计数据', statsResponse.status === 200);
    
    // ISBN接口
    const isbnResponse = await axios.get(`${API_BASE}/isbn/9787111213826`);
    logTest('apiTests', 'ISBN信息查询', isbnResponse.status === 200);
    
    // 设置接口
    const settingsResponse = await axios.get(`${API_BASE}/settings`);
    logTest('apiTests', '获取系统设置', settingsResponse.status === 200);
    
    // 导出接口
    const exportResponse = await axios.get(`${API_BASE}/export/books`);
    logTest('apiTests', '导出图书数据', exportResponse.status === 200);
    
    // 测试POST/PUT/DELETE操作
    const newCategory = {
      name: '最终测试分类',
      code: 'FINAL_TEST_' + Date.now(),
      parentId: null
    };
    
    const addCategoryResponse = await axios.post(`${API_BASE}/categories`, newCategory);
    logTest('apiTests', '添加新分类', addCategoryResponse.status === 200 || addCategoryResponse.status === 201);
    
    if (addCategoryResponse.data.success && addCategoryResponse.data.data?.id) {
      const categoryId = addCategoryResponse.data.data.id;
      
      // 更新分类
      const updateResponse = await axios.put(`${API_BASE}/categories/${categoryId}`, {
        name: '更新最终测试分类'
      });
      logTest('apiTests', '更新分类', updateResponse.status === 200);
      
      // 删除分类
      const deleteResponse = await axios.delete(`${API_BASE}/categories/${categoryId}`);
      logTest('apiTests', '删除分类', deleteResponse.status === 200);
    }
    
  } catch (error) {
    logTest('apiTests', 'API接口测试', false, error.message);
  }
}

// 2. 前端功能测试
async function testFrontend() {
  console.log('\n🎨 前端功能测试...');
  
  try {
    // 检查项目结构
    const srcExists = fs.existsSync('src');
    logTest('frontendTests', '前端源码目录存在', srcExists);
    
    const appExists = fs.existsSync('src/App.tsx');
    logTest('frontendTests', 'App组件存在', appExists);
    
    const pagesExists = fs.existsSync('src/pages');
    logTest('frontendTests', '页面目录存在', pagesExists);
    
    const componentsExists = fs.existsSync('src/components');
    logTest('frontendTests', '组件目录存在', componentsExists);
    
    // 检查配置文件
    const packageJsonExists = fs.existsSync('package.json');
    logTest('frontendTests', 'package.json存在', packageJsonExists);
    
    const viteConfigExists = fs.existsSync('vite.config.ts');
    logTest('frontendTests', 'Vite配置存在', viteConfigExists);
    
    const tsconfigExists = fs.existsSync('tsconfig.json');
    logTest('frontendTests', 'TypeScript配置存在', tsconfigExists);
    
    // 检查前端服务器是否运行
    try {
      const frontendResponse = await axios.get('http://localhost:5173');
      logTest('frontendTests', '前端服务器运行正常', frontendResponse.status === 200);
    } catch (error) {
      logTest('frontendTests', '前端服务器运行正常', false, '服务器未响应');
    }
    
  } catch (error) {
    logTest('frontendTests', '前端功能测试', false, error.message);
  }
}

// 3. 数据库功能测试
async function testDatabase() {
  console.log('\n🗄️ 数据库功能测试...');
  
  try {
    // 检查数据库文件
    const dbExists = fs.existsSync('data/library.db') || fs.existsSync('api/data/library.db');
    logTest('databaseTests', '数据库文件存在', dbExists);
    
    // 通过API测试数据库连接
    const healthResponse = await axios.get(`${API_BASE}/health`);
    const dbConnected = healthResponse.data.database === 'Connected';
    logTest('databaseTests', '数据库连接正常', dbConnected);
    
    // 测试各表的查询
    const categoriesResponse = await axios.get(`${API_BASE}/categories`);
    logTest('databaseTests', '分类表查询正常', categoriesResponse.status === 200);
    
    const booksResponse = await axios.get(`${API_BASE}/books`);
    logTest('databaseTests', '图书表查询正常', booksResponse.status === 200);
    
    const borrowsResponse = await axios.get(`${API_BASE}/borrows`);
    logTest('databaseTests', '借阅表查询正常', borrowsResponse.status === 200);
    
    const settingsResponse = await axios.get(`${API_BASE}/settings`);
    logTest('databaseTests', '设置表查询正常', settingsResponse.status === 200);
    
    // 检查settings表是否有type字段和max_borrow_books设置
    if (settingsResponse.data.success) {
      const settings = settingsResponse.data.data;
      if (typeof settings === 'object' && settings !== null) {
        const hasMaxBorrowBooks = 'max_borrow_books' in settings;
        logTest('databaseTests', 'max_borrow_books设置存在', hasMaxBorrowBooks);
        
        // 检查任意一个设置项是否有type字段
        const hasTypeField = Object.values(settings).some(s => s && typeof s === 'object' && 'type' in s);
        logTest('databaseTests', 'settings表type字段存在', hasTypeField);
        
        logTest('databaseTests', 'settings数据格式正确', true);
      } else {
        logTest('databaseTests', 'settings数据格式正确', false, 'settings数据格式错误');
      }
    }
    
  } catch (error) {
    logTest('databaseTests', '数据库功能测试', false, error.message);
  }
}

// 4. 整体功能测试
async function testOverall() {
  console.log('\n🔧 整体功能测试...');
  
  try {
    // 检查服务器是否运行
    const serverResponse = await axios.get(`${API_BASE}/health`);
    logTest('overallTests', '后端服务器运行正常', serverResponse.status === 200);
    
    // 检查前端是否可访问
    try {
      const frontendResponse = await axios.get('http://localhost:5173');
      logTest('overallTests', '前端应用可访问', frontendResponse.status === 200);
    } catch (error) {
      logTest('overallTests', '前端应用可访问', false, '前端服务器未运行');
    }
    
    // 检查API和前端的集成
    const statsResponse = await axios.get(`${API_BASE}/statistics/overview`);
    if (statsResponse.data.success) {
      logTest('overallTests', 'API数据响应正常', true);
    } else {
      logTest('overallTests', 'API数据响应正常', false, '统计数据获取失败');
    }
    
  } catch (error) {
    logTest('overallTests', '整体功能测试', false, error.message);
  }
}

// 生成测试报告
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 最终测试结果汇总:');
  console.log('='.repeat(60));
  
  const categories = ['apiTests', 'frontendTests', 'databaseTests', 'overallTests'];
  const categoryNames = ['API接口测试', '前端功能测试', '数据库功能测试', '整体功能测试'];
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  categories.forEach((category, index) => {
    const result = testResults[category];
    const total = result.passed + result.failed;
    const successRate = total > 0 ? ((result.passed / total) * 100).toFixed(1) : '0.0';
    
    console.log(`\n${categoryNames[index]}:`);
    console.log(`  ✅ 通过: ${result.passed}`);
    console.log(`  ❌ 失败: ${result.failed}`);
    console.log(`  📊 成功率: ${successRate}%`);
    
    if (result.errors.length > 0) {
      console.log(`  ⚠️ 错误详情:`);
      result.errors.forEach(error => {
        console.log(`    - ${error.test}: ${error.error}`);
      });
    }
    
    totalPassed += result.passed;
    totalFailed += result.failed;
  });
  
  const overallTotal = totalPassed + totalFailed;
  const overallSuccessRate = overallTotal > 0 ? ((totalPassed / overallTotal) * 100).toFixed(1) : '0.0';
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 总体测试结果:');
  console.log(`✅ 总通过: ${totalPassed}`);
  console.log(`❌ 总失败: ${totalFailed}`);
  console.log(`📊 总成功率: ${overallSuccessRate}%`);
  
  if (parseFloat(overallSuccessRate) >= 99.0) {
    console.log('🎉 测试结果优秀！系统运行状态良好！');
  } else if (parseFloat(overallSuccessRate) >= 95.0) {
    console.log('👍 测试结果良好！系统基本正常运行！');
  } else {
    console.log('⚠️ 测试结果需要改进，请检查失败的测试项！');
  }
  
  console.log('='.repeat(60));
  
  return {
    totalPassed,
    totalFailed,
    overallSuccessRate: parseFloat(overallSuccessRate),
    details: testResults
  };
}

// 主测试函数
async function runFinalTest() {
  console.log('🚀 开始最终综合测试...');
  console.log('测试时间:', new Date().toLocaleString());
  console.log('='.repeat(60));
  
  await testAPIs();
  await delay(1000);
  
  await testFrontend();
  await delay(1000);
  
  await testDatabase();
  await delay(1000);
  
  await testOverall();
  await delay(1000);
  
  const report = generateReport();
  
  // 保存测试报告
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPassed: report.totalPassed,
      totalFailed: report.totalFailed,
      overallSuccessRate: report.overallSuccessRate
    },
    details: report.details
  };
  
  fs.writeFileSync('final-test-report.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 详细测试报告已保存到: final-test-report.json');
  
  return report;
}

// 运行测试
runFinalTest().catch(console.error);

export { runFinalTest };