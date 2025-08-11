/**
 * 桌面客户端功能测试脚本
 * 测试Electron桌面应用的各项功能
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

class DesktopClientTester {
  constructor() {
    this.clientPath = path.join(process.cwd(), 'desktop-client');
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

  async testProjectStructure() {
    console.log('\n📁 测试桌面客户端项目结构...');
    
    try {
      // 检查主要文件
      const requiredFiles = [
        'package.json',
        'main.js',
        'webpack.config.js',
        'babel.config.js'
      ];
      
      for (const file of requiredFiles) {
        const filePath = path.join(this.clientPath, file);
        const exists = fs.existsSync(filePath);
        await this.logTest(`文件存在: ${file}`, exists);
      }
      
      // 检查目录结构
      const requiredDirs = [
        'src',
        'src/pages',
        'src/services',
        'src/styles',
        'renderer',
        'assets'
      ];
      
      for (const dir of requiredDirs) {
        const dirPath = path.join(this.clientPath, dir);
        const exists = fs.existsSync(dirPath);
        await this.logTest(`目录存在: ${dir}`, exists);
      }
      
    } catch (error) {
      await this.logTest('项目结构测试', false, error.message);
    }
  }

  async testPackageConfiguration() {
    console.log('\n📦 测试package.json配置...');
    
    try {
      const packagePath = path.join(this.clientPath, 'package.json');
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // 检查基本信息
      await this.logTest('应用名称', !!packageContent.name, packageContent.name);
      await this.logTest('应用版本', !!packageContent.version, packageContent.version);
      await this.logTest('主入口文件', packageContent.main === 'main.js');
      
      // 检查脚本
      const requiredScripts = ['start', 'dev', 'build', 'pack'];
      for (const script of requiredScripts) {
        await this.logTest(`脚本: ${script}`, !!packageContent.scripts[script]);
      }
      
      // 检查依赖
      const requiredDeps = ['electron', 'react', 'react-dom', 'antd', 'axios'];
      const allDeps = { ...packageContent.dependencies, ...packageContent.devDependencies };
      
      for (const dep of requiredDeps) {
        await this.logTest(`依赖: ${dep}`, !!allDeps[dep], allDeps[dep] || '未安装');
      }
      
      // 检查Electron Builder配置
      await this.logTest('Electron Builder配置', !!packageContent.build);
      
    } catch (error) {
      await this.logTest('package.json配置测试', false, error.message);
    }
  }

  async testMainProcess() {
    console.log('\n🖥️ 测试主进程代码...');
    
    try {
      const mainPath = path.join(this.clientPath, 'main.js');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      
      // 检查关键模块导入
      const requiredImports = [
        'electron',
        'BrowserWindow',
        'app',
        'Menu'
      ];
      
      for (const imp of requiredImports) {
        const hasImport = mainContent.includes(imp);
        await this.logTest(`主进程导入: ${imp}`, hasImport);
      }
      
      // 检查关键函数
      const requiredFunctions = [
        'createWindow',
        'createMenu',
        'app.whenReady',
        'window-all-closed'
      ];
      
      for (const func of requiredFunctions) {
        const hasFunction = mainContent.includes(func);
        await this.logTest(`主进程功能: ${func}`, hasFunction);
      }
      
      // 检查窗口配置
      await this.logTest('窗口配置', mainContent.includes('webPreferences'));
      await this.logTest('IPC通信', mainContent.includes('ipcMain'));
      
    } catch (error) {
      await this.logTest('主进程代码测试', false, error.message);
    }
  }

  async testRendererProcess() {
    console.log('\n🎨 测试渲染进程代码...');
    
    try {
      // 检查App.js
      const appPath = path.join(this.clientPath, 'src', 'App.js');
      if (fs.existsSync(appPath)) {
        const appContent = fs.readFileSync(appPath, 'utf8');
        await this.logTest('App组件存在', true);
        await this.logTest('React导入', appContent.includes('react'));
        await this.logTest('路由配置', appContent.includes('Router') || appContent.includes('Route'));
      } else {
        await this.logTest('App组件存在', false, 'App.js文件不存在');
      }
      
      // 检查页面组件
      const pagesDir = path.join(this.clientPath, 'src', 'pages');
      if (fs.existsSync(pagesDir)) {
        const pages = fs.readdirSync(pagesDir);
        await this.logTest('页面组件数量', pages.length > 0, `${pages.length}个页面`);
        
        const expectedPages = [
          'Dashboard.js',
          'BookManagement.js',
          'BorrowManagement.js',
          'Categories.js',
          'Statistics.js',
          'Settings.js'
        ];
        
        for (const page of expectedPages) {
          const exists = pages.includes(page);
          await this.logTest(`页面: ${page}`, exists);
        }
      }
      
      // 检查API服务
      const apiPath = path.join(this.clientPath, 'src', 'services', 'api.js');
      if (fs.existsSync(apiPath)) {
        const apiContent = fs.readFileSync(apiPath, 'utf8');
        await this.logTest('API服务存在', true);
        await this.logTest('Axios导入', apiContent.includes('axios'));
        await this.logTest('API基础URL', apiContent.includes('baseURL') || apiContent.includes('localhost'));
      } else {
        await this.logTest('API服务存在', false, 'api.js文件不存在');
      }
      
    } catch (error) {
      await this.logTest('渲染进程代码测试', false, error.message);
    }
  }

  async testWebpackConfiguration() {
    console.log('\n⚙️ 测试Webpack配置...');
    
    try {
      const webpackPath = path.join(this.clientPath, 'webpack.config.js');
      if (fs.existsSync(webpackPath)) {
        const webpackContent = fs.readFileSync(webpackPath, 'utf8');
        
        await this.logTest('Webpack配置存在', true);
        await this.logTest('入口配置', webpackContent.includes('entry'));
        await this.logTest('输出配置', webpackContent.includes('output'));
        await this.logTest('模块配置', webpackContent.includes('module'));
        await this.logTest('插件配置', webpackContent.includes('plugins'));
        await this.logTest('开发服务器', webpackContent.includes('devServer'));
        
        // 检查Loader配置
        await this.logTest('Babel Loader', webpackContent.includes('babel-loader'));
        await this.logTest('CSS Loader', webpackContent.includes('css-loader'));
        await this.logTest('Style Loader', webpackContent.includes('style-loader'));
        
      } else {
        await this.logTest('Webpack配置存在', false, 'webpack.config.js文件不存在');
      }
      
    } catch (error) {
      await this.logTest('Webpack配置测试', false, error.message);
    }
  }

  async testBabelConfiguration() {
    console.log('\n🔄 测试Babel配置...');
    
    try {
      const babelPath = path.join(this.clientPath, 'babel.config.js');
      if (fs.existsSync(babelPath)) {
        const babelContent = fs.readFileSync(babelPath, 'utf8');
        
        await this.logTest('Babel配置存在', true);
        await this.logTest('Preset Env', babelContent.includes('@babel/preset-env'));
        await this.logTest('Preset React', babelContent.includes('@babel/preset-react'));
        
      } else {
        await this.logTest('Babel配置存在', false, 'babel.config.js文件不存在');
      }
      
    } catch (error) {
      await this.logTest('Babel配置测试', false, error.message);
    }
  }

  async testDependenciesInstallation() {
    console.log('\n📚 测试依赖安装状态...');
    
    try {
      const nodeModulesPath = path.join(this.clientPath, 'node_modules');
      const nodeModulesExists = fs.existsSync(nodeModulesPath);
      
      await this.logTest('node_modules存在', nodeModulesExists);
      
      if (nodeModulesExists) {
        // 检查关键依赖是否安装
        const keyDependencies = [
          'electron',
          'react',
          'react-dom',
          'antd',
          'axios',
          'webpack',
          '@babel/core'
        ];
        
        for (const dep of keyDependencies) {
          const depPath = path.join(nodeModulesPath, dep);
          const installed = fs.existsSync(depPath);
          await this.logTest(`依赖安装: ${dep}`, installed);
        }
        
        // 检查package-lock.json
        const lockPath = path.join(this.clientPath, 'package-lock.json');
        await this.logTest('package-lock.json存在', fs.existsSync(lockPath));
      }
      
    } catch (error) {
      await this.logTest('依赖安装测试', false, error.message);
    }
  }

  async testBuildConfiguration() {
    console.log('\n🏗️ 测试构建配置...');
    
    try {
      // 检查是否可以运行构建命令
      const packagePath = path.join(this.clientPath, 'package.json');
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // 检查构建脚本
      await this.logTest('构建脚本存在', !!packageContent.scripts.build);
      await this.logTest('打包脚本存在', !!packageContent.scripts.pack);
      await this.logTest('分发脚本存在', !!packageContent.scripts.dist);
      
      // 检查Electron Builder配置
      if (packageContent.build) {
        await this.logTest('应用ID配置', !!packageContent.build.appId);
        await this.logTest('产品名称配置', !!packageContent.build.productName);
        await this.logTest('文件配置', !!packageContent.build.files);
        await this.logTest('Windows配置', !!packageContent.build.win);
      }
      
    } catch (error) {
      await this.logTest('构建配置测试', false, error.message);
    }
  }

  async testAssets() {
    console.log('\n🖼️ 测试资源文件...');
    
    try {
      const assetsDir = path.join(this.clientPath, 'assets');
      const assetsExists = fs.existsSync(assetsDir);
      
      await this.logTest('assets目录存在', assetsExists);
      
      if (assetsExists) {
        const assets = fs.readdirSync(assetsDir);
        await this.logTest('资源文件数量', assets.length > 0, `${assets.length}个文件`);
        
        // 检查图标文件
        const iconExists = assets.some(file => file.includes('icon'));
        await this.logTest('应用图标存在', iconExists);
      }
      
    } catch (error) {
      await this.logTest('资源文件测试', false, error.message);
    }
  }

  async testRendererBuild() {
    console.log('\n🔨 测试渲染进程构建...');
    
    try {
      const rendererDir = path.join(this.clientPath, 'renderer');
      const rendererExists = fs.existsSync(rendererDir);
      
      await this.logTest('renderer目录存在', rendererExists);
      
      if (rendererExists) {
        const rendererFiles = fs.readdirSync(rendererDir);
        await this.logTest('渲染进程文件', rendererFiles.length > 0, `${rendererFiles.length}个文件`);
        
        // 检查HTML文件
        const htmlExists = rendererFiles.some(file => file.endsWith('.html'));
        await this.logTest('HTML文件存在', htmlExists);
        
        // 检查JS文件
        const jsExists = rendererFiles.some(file => file.endsWith('.js'));
        await this.logTest('JS文件存在', jsExists);
      }
      
    } catch (error) {
      await this.logTest('渲染进程构建测试', false, error.message);
    }
  }

  async generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📋 桌面客户端功能测试结果汇总:');
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
    
    console.log('\n🎉 桌面客户端功能测试完成!');
    
    // 生成测试报告文件
    const report = {
      timestamp: new Date().toISOString(),
      clientPath: this.clientPath,
      summary: {
        total: this.testResults.passed + this.testResults.failed,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        successRate: ((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)
      },
      tests: this.testResults.tests
    };
    
    fs.writeFileSync('desktop-client-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 桌面客户端测试报告已保存到: desktop-client-test-report.json');
  }

  async runAllTests() {
    console.log('🚀 开始桌面客户端功能测试...');
    console.log('='.repeat(50));
    
    try {
      await this.testProjectStructure();
      await this.testPackageConfiguration();
      await this.testMainProcess();
      await this.testRendererProcess();
      await this.testWebpackConfiguration();
      await this.testBabelConfiguration();
      await this.testDependenciesInstallation();
      await this.testBuildConfiguration();
      await this.testAssets();
      await this.testRendererBuild();
      
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error);
    }
  }
}

// 运行测试
const tester = new DesktopClientTester();
tester.runAllTests().catch(console.error);