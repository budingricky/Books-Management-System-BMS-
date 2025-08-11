/**
 * 前端功能手动测试脚本
 * 通过API调用和页面结构分析来验证前端功能
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_BASE_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:5173';

class FrontendManualTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async logTest(testName, passed, details = '') {
    const result = passed ? '✅' : '❌';
    console.log(`${result} ${testName}${details ? ': ' + details : ''}`);
    
    this.testResults.tests.push({
      name: testName,
      passed,
      details
    });
    
    if (passed) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
    }
  }

  async testFrontendStructure() {
    console.log('\n📁 测试前端项目结构...');
    
    const requiredFiles = [
      'src/App.tsx',
      'src/pages/Home.tsx',
      'src/pages/Books.tsx',
      'src/pages/Borrows.tsx',
      'src/pages/Categories.tsx',
      'src/pages/Statistics.tsx',
      'src/pages/Settings.tsx',
      'src/components/Layout.tsx',
      'src/utils/api.ts'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      await this.logTest(`文件存在: ${file}`, exists);
    }
  }

  async testAPIIntegration() {
    console.log('\n🔌 测试API集成...');
    
    try {
      // 测试健康检查
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      await this.logTest('API健康检查', healthResponse.status === 200, '服务器正常运行');
      
      // 测试图书API
      const booksResponse = await axios.get(`${API_BASE_URL}/books`);
      await this.logTest('图书API连接', booksResponse.status === 200, `返回${booksResponse.data.data?.books?.length || 0}本图书`);
      
      // 测试分类API
      const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`);
      await this.logTest('分类API连接', categoriesResponse.status === 200, `返回${categoriesResponse.data.data?.length || 0}个分类`);
      
      // 测试借阅API
      const borrowsResponse = await axios.get(`${API_BASE_URL}/borrows`);
      await this.logTest('借阅API连接', borrowsResponse.status === 200, `返回${borrowsResponse.data.data?.borrows?.length || 0}条借阅记录`);
      
      // 测试统计API
      const statsResponse = await axios.get(`${API_BASE_URL}/statistics/overview`);
      await this.logTest('统计API连接', statsResponse.status === 200, '统计数据正常');
      
      // 测试设置API
      const settingsResponse = await axios.get(`${API_BASE_URL}/settings`);
      await this.logTest('设置API连接', settingsResponse.status === 200, '设置数据正常');
      
    } catch (error) {
      await this.logTest('API集成测试', false, error.message);
    }
  }

  async testFrontendServer() {
    console.log('\n🌐 测试前端服务器...');
    
    try {
      const response = await axios.get(FRONTEND_URL, {
        timeout: 5000,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      const isHTML = response.headers['content-type']?.includes('text/html');
      await this.logTest('前端服务器运行', response.status === 200 && isHTML, `状态码: ${response.status}`);
      
      // 检查HTML内容
      const htmlContent = response.data;
      const hasReactRoot = htmlContent.includes('id="root"') || htmlContent.includes('id="app"');
      await this.logTest('React根元素存在', hasReactRoot);
      
      const hasTitle = htmlContent.includes('<title>') && htmlContent.includes('</title>');
      await this.logTest('页面标题存在', hasTitle);
      
    } catch (error) {
      await this.logTest('前端服务器测试', false, error.message);
    }
  }

  async testComponentStructure() {
    console.log('\n🧩 测试组件结构...');
    
    const components = [
      { file: 'src/App.tsx', name: 'App组件' },
      { file: 'src/components/Layout.tsx', name: 'Layout组件' },
      { file: 'src/pages/Home.tsx', name: 'Home页面' },
      { file: 'src/pages/Books.tsx', name: 'Books页面' },
      { file: 'src/pages/Borrows.tsx', name: 'Borrows页面' },
      { file: 'src/pages/Categories.tsx', name: 'Categories页面' },
      { file: 'src/pages/Statistics.tsx', name: 'Statistics页面' },
      { file: 'src/pages/Settings.tsx', name: 'Settings页面' }
    ];
    
    for (const component of components) {
      try {
        const filePath = path.join(process.cwd(), component.file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 检查是否是React组件
        const isReactComponent = content.includes('import') && 
                                (content.includes('export default') || content.includes('export function'));
        await this.logTest(`${component.name}结构`, isReactComponent);
        
        // 检查是否使用了TypeScript
        const isTypeScript = component.file.endsWith('.tsx') && content.includes('interface');
        await this.logTest(`${component.name}TypeScript`, isTypeScript);
        
      } catch (error) {
        await this.logTest(`${component.name}检查`, false, error.message);
      }
    }
  }

  async testRoutingConfiguration() {
    console.log('\n🛣️ 测试路由配置...');
    
    try {
      const appPath = path.join(process.cwd(), 'src/App.tsx');
      const appContent = fs.readFileSync(appPath, 'utf8');
      
      // 检查路由配置
      const hasRouter = appContent.includes('BrowserRouter') || appContent.includes('Router');
      await this.logTest('路由器配置', hasRouter);
      
      const hasRoutes = appContent.includes('Routes') && appContent.includes('Route');
      await this.logTest('路由定义', hasRoutes);
      
      // 检查各个页面路由
      const routes = [
        { path: '/', component: 'Home' },
        { path: '/books', component: 'Books' },
        { path: '/borrows', component: 'Borrows' },
        { path: '/categories', component: 'Categories' },
        { path: '/statistics', component: 'Statistics' },
        { path: '/settings', component: 'Settings' }
      ];
      
      for (const route of routes) {
        const hasRoute = appContent.includes(`path="${route.path}"`) && 
                        appContent.includes(route.component);
        await this.logTest(`路由: ${route.path}`, hasRoute);
      }
      
    } catch (error) {
      await this.logTest('路由配置检查', false, error.message);
    }
  }

  async testUILibraryIntegration() {
    console.log('\n🎨 测试UI库集成...');
    
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // 检查Ant Design
      const hasAntd = packageContent.dependencies?.antd || packageContent.devDependencies?.antd;
      await this.logTest('Ant Design依赖', !!hasAntd, hasAntd ? `版本: ${hasAntd}` : '');
      
      // 检查图标库
      const hasIcons = packageContent.dependencies?.['@ant-design/icons'] || 
                      packageContent.devDependencies?.['@ant-design/icons'];
      await this.logTest('Ant Design图标', !!hasIcons);
      
      // 检查组件中的UI库使用
      const layoutPath = path.join(process.cwd(), 'src/components/Layout.tsx');
      const layoutContent = fs.readFileSync(layoutPath, 'utf8');
      
      const usesAntdComponents = layoutContent.includes('import') && 
                                layoutContent.includes('antd');
      await this.logTest('UI组件使用', usesAntdComponents);
      
    } catch (error) {
      await this.logTest('UI库集成检查', false, error.message);
    }
  }

  async testStateManagement() {
    console.log('\n🗃️ 测试状态管理...');
    
    try {
      // 检查API工具
      const apiPath = path.join(process.cwd(), 'src/utils/api.ts');
      const apiContent = fs.readFileSync(apiPath, 'utf8');
      
      const hasAxios = apiContent.includes('axios');
      await this.logTest('HTTP客户端(Axios)', hasAxios);
      
      const hasAPIEndpoints = apiContent.includes('booksAPI') && 
                             apiContent.includes('borrowsAPI') && 
                             apiContent.includes('categoriesAPI');
      await this.logTest('API端点定义', hasAPIEndpoints);
      
      // 检查错误处理
      const hasErrorHandling = apiContent.includes('interceptors') || 
                              apiContent.includes('catch');
      await this.logTest('错误处理机制', hasErrorHandling);
      
    } catch (error) {
      await this.logTest('状态管理检查', false, error.message);
    }
  }

  async testBuildConfiguration() {
    console.log('\n⚙️ 测试构建配置...');
    
    try {
      // 检查Vite配置
      const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
      const hasViteConfig = fs.existsSync(viteConfigPath);
      await this.logTest('Vite配置文件', hasViteConfig);
      
      if (hasViteConfig) {
        const viteContent = fs.readFileSync(viteConfigPath, 'utf8');
        const hasReactPlugin = viteContent.includes('@vitejs/plugin-react');
        await this.logTest('React插件配置', hasReactPlugin);
      }
      
      // 检查TypeScript配置
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      const hasTsConfig = fs.existsSync(tsconfigPath);
      await this.logTest('TypeScript配置', hasTsConfig);
      
      // 检查Tailwind配置
      const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.js');
      const hasTailwindConfig = fs.existsSync(tailwindConfigPath);
      await this.logTest('Tailwind配置', hasTailwindConfig);
      
    } catch (error) {
      await this.logTest('构建配置检查', false, error.message);
    }
  }

  async generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📋 前端功能测试结果汇总:');
    console.log(`✅ 通过: ${this.testResults.passed}`);
    console.log(`❌ 失败: ${this.testResults.failed}`);
    console.log(`📊 成功率: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);
    
    const failedTests = this.testResults.tests.filter(test => !test.passed);
    if (failedTests.length > 0) {
      console.log('\n❌ 失败的测试:');
      failedTests.forEach(test => {
        console.log(`   - ${test.name}: ${test.details}`);
      });
    }
    
    console.log('\n🎉 前端功能测试完成!');
    
    // 生成测试报告文件
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.passed + this.testResults.failed,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        successRate: ((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)
      },
      tests: this.testResults.tests
    };
    
    fs.writeFileSync('frontend-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 测试报告已保存到: frontend-test-report.json');
  }

  async runAllTests() {
    console.log('🚀 开始前端功能测试...');
    console.log('='.repeat(50));
    
    try {
      await this.testFrontendStructure();
      await this.testComponentStructure();
      await this.testRoutingConfiguration();
      await this.testUILibraryIntegration();
      await this.testStateManagement();
      await this.testBuildConfiguration();
      await this.testFrontendServer();
      await this.testAPIIntegration();
      
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error);
    }
  }
}

// 运行测试
const tester = new FrontendManualTester();
tester.runAllTests().catch(console.error);