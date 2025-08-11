const fs = require('fs');
const path = require('path');
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

// 检查文件是否存在
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// 读取文件内容
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

// 测试桌面客户端项目结构
function testDesktopClientStructure() {
  console.log('\n=== 桌面客户端项目结构测试 ===');
  
  const clientPath = path.join(process.cwd(), 'desktop-client');
  
  // 检查主要文件
  const requiredFiles = [
    'package.json',
    'main.js',
    'webpack.config.js',
    'babel.config.js',
    'src/App.js',
    'src/index.js',
    'src/index.html'
  ];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(clientPath, file);
    const exists = fileExists(filePath);
    logTest(`桌面客户端文件: ${file}`, exists);
  });
  
  // 检查目录结构
  const requiredDirs = [
    'src',
    'src/pages',
    'src/services',
    'src/styles',
    'assets',
    'renderer'
  ];
  
  requiredDirs.forEach(dir => {
    const dirPath = path.join(clientPath, dir);
    const exists = fileExists(dirPath);
    logTest(`桌面客户端目录: ${dir}`, exists);
  });
}

// 测试页面组件
function testPageComponents() {
  console.log('\n=== 页面组件测试 ===');
  
  const clientPath = path.join(process.cwd(), 'desktop-client');
  
  const pageComponents = [
    'src/pages/Dashboard.js',
    'src/pages/BookManagement.js',
    'src/pages/BookSearch.js',
    'src/pages/BorrowManagement.js',
    'src/pages/Categories.js',
    'src/pages/Statistics.js',
    'src/pages/Settings.js',
    'src/pages/BatchInput.js',
    'src/pages/Test.js'
  ];
  
  pageComponents.forEach(component => {
    const filePath = path.join(clientPath, component);
    const exists = fileExists(filePath);
    
    if (exists) {
      const content = readFile(filePath);
      if (content) {
        // 检查基本React组件结构
        const hasReactImport = content.includes('React') || content.includes('react');
        const hasExport = content.includes('export') || content.includes('module.exports');
        const hasJSX = content.includes('<') && content.includes('>');
        
        logTest(`${component} - 基本结构`, hasReactImport && hasExport && hasJSX);
        
        // 检查API调用
        const hasAPICall = content.includes('api.') || content.includes('axios') || content.includes('fetch');
        logTest(`${component} - API集成`, hasAPICall);
      } else {
        logTest(`${component} - 文件读取`, false, '无法读取文件内容');
      }
    } else {
      logTest(`${component} - 文件存在`, false, '文件不存在');
    }
  });
}

// 测试主应用文件
function testMainApplication() {
  console.log('\n=== 主应用文件测试 ===');
  
  const clientPath = path.join(process.cwd(), 'desktop-client');
  
  // 测试main.js (Electron主进程)
  const mainPath = path.join(clientPath, 'main.js');
  const mainExists = fileExists(mainPath);
  logTest('Electron主进程文件', mainExists);
  
  if (mainExists) {
    const mainContent = readFile(mainPath);
    if (mainContent) {
      const hasElectron = mainContent.includes('electron');
      logTest('Electron模块导入', hasElectron);
      
      const hasBrowserWindow = mainContent.includes('BrowserWindow');
      logTest('BrowserWindow配置', hasBrowserWindow);
      
      const hasAppReady = mainContent.includes('app.whenReady') || mainContent.includes('app.on');
      logTest('应用生命周期管理', hasAppReady);
    }
  }
  
  // 测试App.js (React主组件)
  const appPath = path.join(clientPath, 'src/App.js');
  const appExists = fileExists(appPath);
  logTest('React主组件文件', appExists);
  
  if (appExists) {
    const appContent = readFile(appPath);
    if (appContent) {
      const hasReact = appContent.includes('React') || appContent.includes('react');
      logTest('React导入', hasReact);
      
      const hasRouting = appContent.includes('Router') || appContent.includes('Route') || appContent.includes('Switch');
      logTest('路由配置', hasRouting);
      
      const hasNavigation = appContent.includes('nav') || appContent.includes('menu') || appContent.includes('sidebar');
      logTest('导航组件', hasNavigation);
    }
  }
}

// 测试API服务
function testAPIService() {
  console.log('\n=== API服务测试 ===');
  
  const clientPath = path.join(process.cwd(), 'desktop-client');
  const apiPath = path.join(clientPath, 'src/services/api.js');
  const apiExists = fileExists(apiPath);
  logTest('API服务文件', apiExists);
  
  if (apiExists) {
    const apiContent = readFile(apiPath);
    if (apiContent) {
      const hasAxios = apiContent.includes('axios');
      logTest('HTTP客户端配置', hasAxios);
      
      const hasBaseURL = apiContent.includes('baseURL') || apiContent.includes('localhost');
      logTest('API基础URL配置', hasBaseURL);
      
      // 检查主要API方法
      const apiMethods = ['books', 'categories', 'borrows', 'statistics', 'settings'];
      apiMethods.forEach(method => {
        const hasMethod = apiContent.includes(method);
        logTest(`API方法: ${method}`, hasMethod);
      });
    }
  }
}

// 测试样式文件
function testStyleFiles() {
  console.log('\n=== 样式文件测试 ===');
  
  const clientPath = path.join(process.cwd(), 'desktop-client');
  
  const styleFiles = [
    'src/styles/App.css',
    'src/styles/global.css'
  ];
  
  styleFiles.forEach(styleFile => {
    const filePath = path.join(clientPath, styleFile);
    const exists = fileExists(filePath);
    logTest(`样式文件: ${styleFile}`, exists);
    
    if (exists) {
      const content = readFile(filePath);
      if (content) {
        const hasCSS = content.includes('{') && content.includes('}');
        logTest(`${styleFile} - CSS语法`, hasCSS);
      }
    }
  });
}

// 测试构建配置
function testBuildConfiguration() {
  console.log('\n=== 构建配置测试 ===');
  
  const clientPath = path.join(process.cwd(), 'desktop-client');
  
  // 测试package.json
  const packagePath = path.join(clientPath, 'package.json');
  const packageExists = fileExists(packagePath);
  logTest('package.json文件', packageExists);
  
  if (packageExists) {
    try {
      const packageContent = readFile(packagePath);
      const packageJson = JSON.parse(packageContent);
      
      // 检查主要依赖
      const requiredDeps = ['electron', 'react', 'react-dom'];
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      requiredDeps.forEach(dep => {
        const hasDep = allDeps[dep] !== undefined;
        logTest(`依赖: ${dep}`, hasDep);
      });
      
      // 检查脚本
      const hasStartScript = packageJson.scripts && packageJson.scripts.start;
      logTest('启动脚本', hasStartScript !== undefined);
      
      const hasBuildScript = packageJson.scripts && packageJson.scripts.build;
      logTest('构建脚本', hasBuildScript !== undefined);
      
    } catch (error) {
      logTest('package.json解析', false, error.message);
    }
  }
  
  // 测试webpack配置
  const webpackPath = path.join(clientPath, 'webpack.config.js');
  const webpackExists = fileExists(webpackPath);
  logTest('Webpack配置文件', webpackExists);
  
  if (webpackExists) {
    const webpackContent = readFile(webpackPath);
    if (webpackContent) {
      const hasEntry = webpackContent.includes('entry');
      logTest('Webpack入口配置', hasEntry);
      
      const hasOutput = webpackContent.includes('output');
      logTest('Webpack输出配置', hasOutput);
      
      const hasLoaders = webpackContent.includes('loader') || webpackContent.includes('use');
      logTest('Webpack加载器配置', hasLoaders);
    }
  }
}

// 测试构建输出
function testBuildOutput() {
  console.log('\n=== 构建输出测试 ===');
  
  const clientPath = path.join(process.cwd(), 'desktop-client');
  
  // 检查渲染器构建输出
  const rendererPath = path.join(clientPath, 'renderer');
  const rendererExists = fileExists(rendererPath);
  logTest('渲染器构建目录', rendererExists);
  
  if (rendererExists) {
    const bundlePath = path.join(rendererPath, 'bundle.js');
    const bundleExists = fileExists(bundlePath);
    logTest('JavaScript打包文件', bundleExists);
    
    const indexPath = path.join(rendererPath, 'index.html');
    const indexExists = fileExists(indexPath);
    logTest('HTML入口文件', indexExists);
  }
  
  // 检查Electron构建输出
  const distPath = path.join(clientPath, 'dist');
  const distExists = fileExists(distPath);
  logTest('Electron构建目录', distExists);
  
  if (distExists) {
    const exePath = path.join(distPath, 'win-unpacked', '图书管理系统.exe');
    const exeExists = fileExists(exePath);
    logTest('可执行文件', exeExists);
  }
}

// 测试API连接
async function testAPIConnection() {
  console.log('\n=== API连接测试 ===');
  
  try {
    const response = await axios.get('http://localhost:3001/api/health');
    const isConnected = response.status === 200;
    logTest('后端API连接', isConnected);
    
    if (isConnected) {
      // 测试主要API端点
      const endpoints = [
        '/api/books',
        '/api/categories',
        '/api/borrows',
        '/api/statistics/overview'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const endpointResponse = await axios.get(`http://localhost:3001${endpoint}`);
          const isWorking = endpointResponse.status === 200;
          logTest(`API端点: ${endpoint}`, isWorking);
        } catch (error) {
          logTest(`API端点: ${endpoint}`, false, error.message);
        }
      }
    }
  } catch (error) {
    logTest('后端API连接', false, error.message);
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始桌面客户端测试...');
  console.log('测试时间:', new Date().toLocaleString());
  
  testDesktopClientStructure();
  testPageComponents();
  testMainApplication();
  testAPIService();
  testStyleFiles();
  testBuildConfiguration();
  testBuildOutput();
  await testAPIConnection();
  
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
  
  console.log('\n📊 桌面客户端测试结果汇总:');
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
  fs.writeFileSync('desktop-client-test-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 桌面客户端测试报告已保存到: desktop-client-test-report.json');
  
  return report;
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };