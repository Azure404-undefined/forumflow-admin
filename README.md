<div align="center">
  <h1>论坛内容社区后台管理系统</h1>
  <span>中文 | <a href="./README.en_US.md">English</a></span>
</div>

---

基于 [SoybeanAdmin ElementPlus](https://github.com/soybeanjs/soybean-admin-element-plus) 模板二次开发的后台管理系统，面向论坛/内容社区业务场景。保留模板的工程化底座（自动化文件路由、主题系统、权限框架、布局），独立实现了业务页面、业务 API 层、全局类型声明与组件封装。

## 二次开发内容

- **业务页面**（`src/views/`）：帖子列表、论坛板块、帖子评论管理（含详情弹窗）、举报管理、角色管理、用户管理、个人中心、首页数据看板重写（StatisticCard）
- **业务 API 层**（`src/service/api/`）：11 个业务模块（comment / forums / post / report / role / system-manage / profile / notice / dashboard / config / user），基于 Apifox 在线 Mock 联调
- **全局类型声明**（`src/typings/api/`）：对应业务模块的完整类型定义
- **组件封装**：分页组件（`custom/pagination.vue`）、安全内容渲染 `safeContend.vue`（DOMPurify 防 XSS）、富文本编辑器封装 `richTextEditor.vue`（wangeditor）
- **移动端适配**：全站窄屏/移动端适配，骨架屏与视觉优化

## 技术栈

Vue 3.5 · TypeScript · Vite 7 (rolldown-vite) · Element Plus · Pinia · UnoCSS · pnpm workspace · Apifox Mock

## 快速开始

```bash
# 环境要求：Node >= 20.19.0, pnpm >= 8.7.0
pnpm install
cp .env.example .env
pnpm dev        # 开发模式（test 环境，使用 Apifox mock 接口）
pnpm build      # 生产构建
```

## 与上游模板的关系

- 上游：[soybean-admin-element-plus](https://github.com/soybeanjs/soybean-admin-element-plus)
- 本仓库在模板基础上删除了演示页面（dashboard / multi-menu 等），实现上述业务功能
- License：MIT（沿用上游）

## License

[MIT](./LICENSE)
