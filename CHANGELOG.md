# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).



## [1.2.0](https://github.com/yinzhenyu-su/weekly-git-summary/compare/v1.1.0...v1.2.0) (2025-10-09)

### ✨ Features

* 使用当前日期替换硬编码日期以增强统计输出 ([32e13de](https://github.com/yinzhenyu-su/weekly-git-summary/commit/32e13de24707e93a9ac553bb9b97c6df7c569c4f))
* 添加多语言支持(--lang参数) ([bb6f0ab](https://github.com/yinzhenyu-su/weekly-git-summary/commit/bb6f0ab5603cf13923b235c74e33b309e76ef188))

### 🐛 Bug Fixes

* handle repoUrl protocol prefixes ([2c559a8](https://github.com/yinzhenyu-su/weekly-git-summary/commit/2c559a8b1ef7fa42eda4adbf1ff622dec184b7e4))

## [1.1.0](https://github.com/yinzhenyu-su/weekly-git-summary/compare/v1.0.5...v1.1.0) (2025-08-25)

### ✨ Features

* add message pattern filtering support ([3b851f7](https://github.com/yinzhenyu-su/weekly-git-summary/commit/3b851f71bda3e41a11ed890c0b011d64974372e7))
* implement comprehensive new features for weekly-git-summary ([d33b191](https://github.com/yinzhenyu-su/weekly-git-summary/commit/d33b1910d76a5586485a0f7cc96698a662a4bd88))
* 完善文档国际化和HTML雷达图优化 ([bbb42f6](https://github.com/yinzhenyu-su/weekly-git-summary/commit/bbb42f6b4bbc6005fa70ba2af487596597ef37c8))

### 🐛 Bug Fixes

* **cli:** resolve date parsing issues ([8a354a0](https://github.com/yinzhenyu-su/weekly-git-summary/commit/8a354a0f57b13601f2792e96474a16cfd5a766d9))
* improve CLI integration and add comprehensive test coverage ([22ccf30](https://github.com/yinzhenyu-su/weekly-git-summary/commit/22ccf30bc2d266147df822a2dc95dfb15a2635e8))

### 💄 Styles

* 使用 eslint 统一代码格式 ([0b0b125](https://github.com/yinzhenyu-su/weekly-git-summary/commit/0b0b125090f78d44b79fe98813d83290593ea993))
* 启用 ES 模块并优化代码格式 ([0e90061](https://github.com/yinzhenyu-su/weekly-git-summary/commit/0e9006106ab6375918529cfe7e34c1565254f17f))

## [1.0.5](https://github.com/yinzhenyu-su/weekly-git-summary/compare/v1.0.4...v1.0.5) (2025-08-05)

### ✨ Features

* 支持多作者过滤和反斜杠转义空格参数 ([f912c58](https://github.com/yinzhenyu-su/weekly-git-summary/commit/f912c58e3e005a53eff7c5d11883fdf0a9743bb4)), closes [#3](https://github.com/yinzhenyu-su/weekly-git-summary/issues/3)
* 支持多作者过滤和反斜杠转义空格参数 ([2f8934f](https://github.com/yinzhenyu-su/weekly-git-summary/commit/2f8934f9c1850084dc778cbbcf4599db2b8cbab6))

### 🐛 Bug Fixes

* 修复 -a 参数包含空格的作者名称处理问题 (关联 issue [#3](https://github.com/yinzhenyu-su/weekly-git-summary/issues/3)) ([06ffe3c](https://github.com/yinzhenyu-su/weekly-git-summary/commit/06ffe3cc2ca32fa48235c60c027e424ef1b1bffa))
* 修复按作者过滤时查询不到 commit 记录 [#3](https://github.com/yinzhenyu-su/weekly-git-summary/issues/3) ([bfde0db](https://github.com/yinzhenyu-su/weekly-git-summary/commit/bfde0dbe8110ffbf3f694d71c1a50e80b83a2ffe))

### ♻️ Code Refactoring

* 统一代码风格，调整测试文件中的字符串引号和格式 ([cc6f189](https://github.com/yinzhenyu-su/weekly-git-summary/commit/cc6f189e07476538e8d54189c56ced3b72432e84))
* 重构 weekly-git-summary 为 ts ([34396b1](https://github.com/yinzhenyu-su/weekly-git-summary/commit/34396b1b569c8552b2f1f3af3c574304bbe12c9f))

### ✅ Tests

* 增强Windows兼容性测试，添加对包含空格的作者名称的错误处理 ([597136e](https://github.com/yinzhenyu-su/weekly-git-summary/commit/597136e9447c54cf43ecd0e846c4e96354562086))

## [1.0.4](https://github.com/yinzhenyu-su/weekly-git-summary/compare/v1.0.3...v1.0.4) (2025-07-09)

### 🐛 Bug Fixes

* 修复 Windows 下 author 参数包含引号的问题 ([18bc178](https://github.com/yinzhenyu-su/weekly-git-summary/commit/18bc178ff477411b11b57312b83d3941d99a74c6))
* 修复跨平台路径处理问题，解决 Windows 测试失败 ([aac5a07](https://github.com/yinzhenyu-su/weekly-git-summary/commit/aac5a07dfa6e9fe960b3525a208b9288884376af))

### 📚 Documentation

* 更新 README 项目结构和 CI 配置 ([4529b03](https://github.com/yinzhenyu-su/weekly-git-summary/commit/4529b03b06839b6ae417fb8ffb48b09bbf69fde2))
* 添加项目介绍图片和更新 README 文档格式 ([1ea088a](https://github.com/yinzhenyu-su/weekly-git-summary/commit/1ea088a5498d7b0c44dd1769edfdcaeba5e039a0))

### ♻️ Code Refactoring

* 将 converter.sh 功能合并到 weekly-git-summary.sh 中 ([6118d5f](https://github.com/yinzhenyu-su/weekly-git-summary/commit/6118d5f55e552ed5d9b3d7cfc52fa1f534d6c9b4))
* 将 git-log.html 移动到 scripts 目录并调整路径引用 ([6133789](https://github.com/yinzhenyu-su/weekly-git-summary/commit/6133789d52aaa2325a49c9e217ef4dad9e730325))

### 🏗️ Build System

* 配置构建脚本包含 PowerShell 脚本文件 ([55ddf46](https://github.com/yinzhenyu-su/weekly-git-summary/commit/55ddf4664d1f0a8c428eb706d4f4819f2ce703bf))

### 🔧 Maintenance

* 删除 converter.sh 文件，功能已合并到 weekly-git-summary.sh ([9a6ac64](https://github.com/yinzhenyu-su/weekly-git-summary/commit/9a6ac6456cdf650cb9ce6552d74e05b1d37517e7))

## [1.0.3](https://github.com/yinzhenyu-su/weekly-git-summary/compare/v1.0.2...v1.0.3) (2025-07-09)

### 🐛 Bug Fixes

* 更新页面标题和开发者信息，修正链接至正确的社交媒体 ([908b8e9](https://github.com/yinzhenyu-su/weekly-git-summary/commit/908b8e936412ba14ce87f8927ec1e05034fe2718))

## [1.0.2](https://github.com/yinzhenyu-su/weekly-git-summary/compare/v1.0.1...v1.0.2) (2025-07-08)

### 🐛 Bug Fixes

* 修复 Windows 系统 HTML 输出功能递归调用错误 ([1fc6a71](https://github.com/yinzhenyu-su/weekly-git-summary/commit/1fc6a710ab20475ac88499102d3bfbd0a226f169))

### ♻️ Code Refactoring

* 重组测试结构并优化 GitHub Workflows ([73d527e](https://github.com/yinzhenyu-su/weekly-git-summary/commit/73d527ecd533cf7994ef288a15d495f3ed16e5e5))

## 1.0.1 (2025-07-08)

### ✨ Features

* add weekly-git-summary script for generating git commit summaries ([6a95d38](https://github.com/yinzhenyu-su/weekly-git-summary/commit/6a95d385462f37fe3c9e90c88cc00d2dff75bffd))
* 为Git周报工具添加调试模式和时间范围精确控制 ([1cced74](https://github.com/yinzhenyu-su/weekly-git-summary/commit/1cced742ee7bc7ffbfa2b7dae8a630f65583cf1c))
* 将 PowerShell 脚本迁移到 Node.js，添加 GitHub CI/CD ([64f8309](https://github.com/yinzhenyu-su/weekly-git-summary/commit/64f830926e18135605f6d033e311b556cf13222e))
* 新增测试文件和配置，支持跨平台的Git周报工具 ([b4f07bc](https://github.com/yinzhenyu-su/weekly-git-summary/commit/b4f07bcf78897af29b87b05e100a5aed28d5e455))
* 新增跨平台的Git周报工具脚本 ([4fa509d](https://github.com/yinzhenyu-su/weekly-git-summary/commit/4fa509d41539a5361f094c7928e46ccfecec11ce))
* 添加 HTML 输出功能，支持生成可视化 Git 提交记录 ([b9cb269](https://github.com/yinzhenyu-su/weekly-git-summary/commit/b9cb2697d5535bbd44b10e05a94bee025b6a5814))
* 添加Markdown输出格式支持，并在提交记录中包含哈希值 ([2e2860d](https://github.com/yinzhenyu-su/weekly-git-summary/commit/2e2860debb7c64709f35b0e5752c49c6b1017569))
* 配置 release-it 和自动发布流程 ([95e1b96](https://github.com/yinzhenyu-su/weekly-git-summary/commit/95e1b968d25e6dbda23a51aa635d41282415cac6))

### 📚 Documentation

* 更新README并添加工具使用说明和示例图片 ([b24d12d](https://github.com/yinzhenyu-su/weekly-git-summary/commit/b24d12dcb4e96c1180e7eaeab9625d17097766f1))
* 更新文档 ([968b3b6](https://github.com/yinzhenyu-su/weekly-git-summary/commit/968b3b6e5b5cee9c45439c0ed6a4f6388b744b0a))

### ♻️ Code Refactoring

*  重构构建脚本和测试用例 ([114714b](https://github.com/yinzhenyu-su/weekly-git-summary/commit/114714b13189b481a50baaf863211d0c7df601f7))
* 更新命令行参数接口，支持可选参数并优化帮助信息输出 ([e18aee3](https://github.com/yinzhenyu-su/weekly-git-summary/commit/e18aee3774d5b8fba475c0beb4615e5286fefeb9))
* 移除帮助信息中的调试模式示例 ([bf6d2c1](https://github.com/yinzhenyu-su/weekly-git-summary/commit/bf6d2c1563874b29584d995e02c2a83071358d40))
* 移除调试模式相关代码，简化脚本 ([cc9d45e](https://github.com/yinzhenyu-su/weekly-git-summary/commit/cc9d45e64cb3582a636732ad25d4ffcffa01e02b))
* 重构代码结构, 添加 git-log.html 文件 ([9be7c22](https://github.com/yinzhenyu-su/weekly-git-summary/commit/9be7c2232f93eb301c9ad1eca46d2c04489c2562))
