<div align="center">
  <img src="./public/forumflow-logo.png" width="112" alt="ForumFlow Logo" />
  <h1>ForumFlow 社区内容管理平台</h1>
  <p>面向论坛与内容社区的审核、运营和权限管理后台</p>
  <p><strong>在线演示：</strong><a href="https://forumflow-admin.vercel.app/">https://forumflow-admin.vercel.app/</a></p>
  <p>中文 | <a href="./README.en_US.md">English</a></p>
</div>

---

ForumFlow 是一个基于 Vue 3、TypeScript 和 Element Plus 实现的社区内容管理平台，覆盖内容审核、用户与角色管理、板块配置、公告管理、数据看板和个人中心等业务模块。

项目重点解决三个问题：不同角色看到正确的功能、演示数据连续刷新保持一致、富文本内容在展示前经过安全净化。

## 项目预览

| 运营数据看板 | 帖子审核管理 |
| --- | --- |
| ![ForumFlow 首页数据看板](./docs/screenshots/home-desktop.png) | ![ForumFlow 帖子管理](./docs/screenshots/post-list-desktop.png) |

<p align="center">
  <img src="./docs/screenshots/common-user-mobile.png" width="320" alt="ForumFlow 普通用户移动端只读页面" />
</p>

## 演示账号

| 角色 | 用户名 | 密码 | 主要能力 |
| --- | --- | --- | --- |
| 超级管理员 | <code>Super</code> | <code>123456</code> | 全部菜单、角色权限和系统配置 |
| 管理员 | <code>Admin</code> | <code>123456</code> | 用户、帖子、板块、评论、举报和公告管理 |
| 普通用户 | <code>User</code> | <code>123456</code> | 查看已发布帖子、启用板块和已发布公告 |

演示环境使用固定数据基线。写操作用于展示交互反馈，刷新或重新查询后会恢复初始数据。

## 核心功能

- 用户与角色：用户筛选、状态管理、角色分配、受保护账号约束和按钮级权限。
- 内容审核：帖子、评论和举报的详情核验、状态处理及批量操作。
- 社区配置：树形板块、公告发布、系统配置和普通用户只读视图。
- 个人中心：资料、统计、动态、浏览记录、收藏、登录日志、会话和隐私设置。
- 数据看板：统计指标、趋势、热门帖子和热门板块均引用同一套固定数据。
- 富文本安全：WangEditor 编辑，DOMPurify 净化，iframe 仅允许 HTTPS 的 Bilibili 播放域名。
- 响应式体验：核心业务路由适配桌面端和 390px 级移动端。

## 权限设计

| 功能区域 | 超级管理员 | 管理员 | 普通用户 |
| --- | --- | --- | --- |
| 首页、关于、个人中心 | 完整访问 | 完整访问 | 完整访问 |
| 用户管理 | 完整管理 | 仅管理普通用户 | 不可见 |
| 角色管理 | 完整管理 | 不可见 | 不可见 |
| 帖子与板块 | 完整管理 | 完整管理 | 仅查看已发布或启用内容 |
| 评论与举报 | 完整管理 | 完整管理 | 不可见 |
| 公告 | 完整管理 | 完整管理 | 仅查看已发布公告 |
| 系统配置 | 完整管理 | 不可见 | 不可见 |

前端采用静态路由 RBAC：路由 <code>meta.roles</code> 控制菜单和直接 URL 访问，统一权限码控制页面按钮；真实后端接入后仍需在服务端执行接口级鉴权。

## 固定演示数据

<code>apifox-mock/</code> 是可提交、可复现的 Apifox 脚本包：

- <code>data/</code> 是 12 名用户、12 条帖子、18 条评论等固定关联数据的唯一来源。
- <code>tools/generate.mjs</code> 生成 68 个可直接配置到 Apifox 的自包含脚本。
- <code>tools/verify.mjs</code> 验证响应包装、分页筛选、四个身份映射和跨模块引用关系。
- <code>/profile</code>、统计、帖子、评论和看板数据均按同一身份及 ID 关联。

~~~bash
node apifox-mock/tools/verify.mjs
~~~

## 技术栈

Vue 3.5 · TypeScript 5.9 · Vite 7 · Element Plus · Pinia · Vue Router · UnoCSS · pnpm workspace · Apifox Mock · WangEditor · DOMPurify

## 项目结构

~~~text
src/
  constants/       角色与按钮权限策略
  router/          静态路由注入、守卫和菜单过滤
  service/api/     业务接口定义
  typings/api/     API 类型契约
  views/           业务页面与个人中心
apifox-mock/
  data/            固定演示数据
  scripts/         逐接口 Mock 脚本
  tools/           脚本生成与关联验证
~~~

## 本地运行

环境要求：Node.js <code>>=20.19.0</code>，pnpm <code>>=8.7.0</code>。

~~~bash
pnpm install
cp .env.example .env
pnpm dev
~~~

生产验收：

~~~bash
pnpm typecheck
pnpm exec eslint .
pnpm build
node apifox-mock/tools/verify.mjs
~~~

## 工程实现

- 业务页面、API 与类型契约保持同名模块对应，降低联调时的字段漂移。
- 权限策略集中维护，页面不直接散落角色字符串和权限码。
- 列表接口先筛选、再计算总数、最后分页，数值状态按字符串标准化比较。
- 固定 Mock 适合公开演示；接入真实后端后需补充服务端鉴权、持久化、审计和上传存储。
- Vercel 使用 History 路由回退和安全响应头，生产环境配置仅包含公开的浏览器端变量。
- 运行时 Iconify 图标由公共 API 按需加载；部署 CSP 的 <code>connect-src</code> 需同时放行主站和两个备用 API，否则动态菜单图标会显示为空。

## 技术来源与致谢

项目采用 [SoybeanAdmin ElementPlus](https://github.com/soybeanjs/soybean-admin-element-plus) 作为工程化基础，我主要完成业务页面、API 与类型契约、权限控制、Apifox 固定演示数据、富文本安全渲染及移动端适配。上游及本仓库遵循 MIT 协议。

## License

[MIT](./LICENSE)
