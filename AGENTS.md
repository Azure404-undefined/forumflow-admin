# 项目信息备忘

本文档记录对当前仓库的项目理解，供后续开发、排查和自动化代理接手时快速参考。

## 1. 项目概览

- 项目名称：`SoybeanAdmin ElementPlus`，根包名为 `@sa/elp`，当前版本 `1.4.0`。
- 项目定位：基于 Vue 3 的中后台管理系统模板，使用 Element Plus 作为 UI 框架，内置主题配置、权限路由、国际化、页面标签、全局搜索、登录与基础管理页面。
- 仓库形态：pnpm monorepo，根应用在 `src/`，内部工具包在 `packages/*`。
- 开源协议：MIT。
- 预览站点：`https://elp.soybeanjs.cn`。

## 2. 技术栈

- 框架与构建：Vue 3、TypeScript、Vite 7（通过 `rolldown-vite` 别名安装）、Vue JSX。
- UI 与样式：Element Plus、UnoCSS、Sass、Iconify、本地 SVG 图标。
- 状态与路由：Pinia、Vue Router、`@elegant-router/vue` 文件路由生成。
- 国际化：`vue-i18n`，语言包位于 `src/locales/langs/`，默认语言来自本地存储或 `zh-CN`。
- 请求层：主请求使用内部包 `@sa/axios`；仓库还提供 `@sa/alova` 和 `@sa/fetch`。
- 图表和可视化：ECharts、AntV G2/G6、VisActor VChart/VTable。
- 常用工具：VueUse、Dayjs、NProgress、clipboard、xlsx、Swiper 等。

## 3. 环境与命令

- Node.js：`package.json` 要求 `>=20.19.0`。
- pnpm：`package.json` 要求 `>=8.7.0`，README 推荐 `>=10.5.0`；不要用 npm 或 yarn 安装依赖。
- 依赖安装：`pnpm i`。
- 本地开发：`pnpm dev`，实际执行 `vite --mode test`。
- 生产模式开发：`pnpm dev:prod`，实际执行 `vite --mode prod`。
- 构建生产包：`pnpm build`，实际执行 `vite build --mode prod`。
- 构建测试包：`pnpm build:test`。
- 预览构建：`pnpm preview`。
- 类型检查：`pnpm typecheck`。
- 代码检查与自动修复：`pnpm lint`。
- 生成路由页面：`pnpm gen-route`。
- 交互式提交信息：`pnpm commit` 或中文界面 `pnpm commit:zh`。
- 清理、发版、更新依赖：`pnpm cleanup`、`pnpm release`、`pnpm update-pkg`。

## 4. 运行配置

- Vite 配置入口：`vite.config.ts`。
- 开发服务器：监听 `0.0.0.0:9527`，`server.open` 为 `true`。
- 预览端口：`9725`。
- 路径别名：
  - `@` 指向 `src/`
  - `~` 指向仓库根目录
- 全局 SCSS：Vite 会向 SCSS 注入 `@/styles/scss/global.scss`。
- 基础环境变量在 `.env`，测试和生产环境分别叠加 `.env.test`、`.env.prod`。
- 当前接口基础地址来自 Apifox Mock：
  - test/prod：`https://m1.apifoxmock.com/m1/8054616-7810015-default/api`
- 默认 `VITE_HTTP_PROXY=N`；如果改为 `Y`，开发服务会通过 `build/config/proxy.ts` 创建代理。
- 默认路由模式为 `history`，可通过 `VITE_ROUTER_HISTORY_MODE` 改为 `hash` 或 `memory`。
- 默认权限路由模式为 `static`，首页路由为 `home`，静态超级角色为 `R_SUPER`。

## 5. 目录结构

- `src/main.ts`：应用启动入口，依次初始化 Loading、NProgress、Iconify、Dayjs、Element Plus、Pinia、Router、i18n 和版本更新检测。
- `src/App.vue`：根组件，包裹 `ElConfigProvider`、`AppProvider`、`ElWatermark` 和 `RouterView`。
- `src/layouts/`：布局层，包含 `base-layout`、`blank-layout` 和全局 header、sider、menu、tab、content、footer、theme drawer 等模块。
- `src/views/`：页面目录，也是 Elegant Router 生成路由的主要来源。
- `src/router/`：路由实例、守卫、内置路由、生成路由和转换逻辑。
- `src/store/`：Pinia stores，包含 app、auth、route、tab、theme。
- `src/service/`：接口定义与请求实例。
- `src/hooks/`：业务和通用 hooks。
- `src/components/`：通用组件、自定义组件和高级表格组件。
- `src/locales/`：国际化配置、语言包、Element Plus UI locale 和 Dayjs locale。
- `src/theme/`：主题默认设置和主题变量。
- `src/styles/`：全局 CSS/SCSS、Element Plus 覆盖、滚动条、过渡和 NProgress 样式。
- `src/typings/`：全局类型、API 类型、路由类型和环境变量类型。
- `src/assets/svg-icon/`：本地 SVG 图标来源。
- `build/`：Vite 插件封装和构建配置。
- `packages/`：内部工作区包。

## 6. 路由与权限

- 路由生成由 `@elegant-router/vue` 负责，插件配置在 `build/plugins/router.ts`。
- 生成结果主要在：
  - `src/router/elegant/routes.ts`
  - `src/router/elegant/imports.ts`
  - `src/typings/elegant-router.d.ts`
- `src/router/routes/builtin.ts` 定义根路由 `/` 和兜底 404 路由。
- `src/router/routes/index.ts` 将 generated routes 分为常量路由和鉴权路由。
- 路由守卫在 `src/router/guard/route.ts`：
  - 未初始化时先注入常量路由和鉴权路由；
  - 未登录访问鉴权路由会跳转登录页；
  - 已登录访问登录页会跳转根路由；
  - 静态权限模式下根据 `route.meta.roles` 和用户角色判断是否允许访问；
  - 无权限跳转 `403`。
- 登录页路由被转换为 `/login/:module(pwd-login|code-login|register|reset-pwd|bind-wechat)?`。
- 新增页面通常应放到 `src/views/`，并通过路由生成流程维护类型和导入。

## 7. 状态管理

- `useAppStore`：移动端断点、布局折叠、全屏内容、刷新页面、语言切换、主题抽屉状态。
- `useThemeStore`：主题模式、颜色、布局、页签、侧边栏、页脚、水印和 CSS 变量。
- `useAuthStore`：token、用户信息、登录、token 登录、获取用户信息、退出与清理。
- `useRouteStore`：常量路由、鉴权路由、菜单、搜索菜单、面包屑、缓存路由、动态路由初始化。
- `useTabStore`：页签新增、切换、关闭、批量关闭、缓存、标签文本变更。
- store id 枚举在 `src/enum/index.ts`。

## 8. 请求与接口

- 主请求实例在 `src/service/request/index.ts`，基于 `@sa/axios` 的 `createFlatRequest`。
- 默认后端响应结构为 `{ code, msg, data }`，成功码来自 `VITE_SERVICE_SUCCESS_CODE`，当前为 `0000`。
- token 从 `localStg` 读取并写入 `Authorization` 请求头。
- 支持退出码、弹窗退出码、token 过期码和刷新 token 后重放请求。
- `request` 返回扁平结果，常见形态为 `{ data, error, response }`。
- 已有 API 模块：
  - `src/service/api/auth.ts`：登录、获取用户信息、刷新 token、自定义后端错误。
  - `src/service/api/route.ts`：常量路由、用户路由、路由存在性检查。
  - `src/service/api/system-manage.ts`：角色、用户、菜单等系统管理接口。
  - `src/service/api/user.ts`：另一个用户 CRUD/批量操作接口模块，目前页面直接从 `@/service/api/user` 引入，未从 `src/service/api/index.ts` 统一导出。
- 额外请求实例 `demoRequest` 使用 `otherBaseURL.demo`，响应结构为 `{ status, message, result }`。

## 9. UI、样式与主题

- Element Plus 在 `src/plugins/ui.ts` 中全量注册。
- 全局修改了部分 Element Plus 默认属性：
  - `ElTableColumn.align` 默认 `center`
  - `ElCard.shadow` 默认 `never`
  - `ElForm.requireAsteriskPosition` 默认 `right`
- 全局样式入口在 `src/plugins/assets.ts`，导入 Element Plus、暗色变量、UnoCSS、全局 CSS、Swiper 样式。
- UnoCSS 配置在 `uno.config.ts`，使用 `presetWind3`、自定义 `presetSoybeanAdmin`、directives 与 variant group transformer。
- 常用 UnoCSS 快捷类来自 `packages/uno-preset`，例如 `flex-center`、`flex-col-stretch`、`absolute-center`、`ellipsis-text`。
- 默认主题设置在 `src/theme/settings.ts`，包含浅色/暗色 token、主色、布局模式、页签模式、侧栏宽度、水印和页脚配置。
- 本地图标位于 `src/assets/svg-icon/`，由 `unplugin-icons`、`vite-plugin-svg-icons` 和 UnoCSS icon preset 共同处理。

## 10. 国际化

- i18n 入口为 `src/locales/index.ts`。
- 语言包聚合在 `src/locales/locale.ts`，具体语言在 `src/locales/langs/zh-cn.ts` 和 `src/locales/langs/en-us.ts`。
- Element Plus UI locale 映射在 `src/locales/ui.ts`。
- Dayjs locale 在 `src/locales/dayjs.ts` 中切换。
- 应用语言保存在本地存储 `lang`，切换语言会同步更新页面标题、菜单和页签。

## 11. 工作区包

- `@sa/axios`：基于 axios、axios-retry、AbortController 的请求封装，提供 `createRequest` 和 `createFlatRequest`。
- `@sa/alova`：基于 alova 的请求封装，内置 Vue hook、fetch adapter 和 token refresh 流程。
- `@sa/fetch`：基于 ofetch 的轻量请求创建函数。
- `@sa/hooks`：通用 hooks，如 loading、boolean、countdown、context、svg icon render、table。
- `@sa/materials`：后台布局、页签、简单滚动条等物料组件。
- `@sa/utils`：crypto、storage、nanoid、klona 等工具。
- `@sa/color`：颜色调色板、颜色名和主题色处理工具。
- `@sa/uno-preset`：项目内 UnoCSS shortcut preset。
- `@sa/scripts`：项目 CLI，bin 名为 `sa`，支持 commit、cleanup、update-pkg、changelog、release、gen-route、print-soybean。

## 12. 开发约定

- TypeScript 开启 `strict` 和 `strictNullChecks`。
- 编辑规范来自 `.editorconfig`：UTF-8、2 空格、LF、去除行尾空格、文件末尾保留换行。
- ESLint 配置在 `eslint.config.js`，基于 `@soybeanjs/eslint-config`，开启 Vue 和 UnoCSS 规则。
- 组件名规则允许 `index`、`App`、`Register`、`[id]`、`[url]` 等例外。
- 模板组件名倾向 PascalCase，`/^icon-/` 图标组件例外。
- Git hooks：
  - `commit-msg` 执行 `pnpm sa git-commit-verify`
  - `pre-commit` 执行 `pnpm typecheck && pnpm lint && git diff --exit-code`
- 提交信息建议使用内置 `pnpm commit`，符合 Conventional Commits。

## 13. 已识别页面

- 内置页面：登录、403、404、500、iframe 页面。
- `src/views/user/index.vue` 是一套独立的用户列表/新增/编辑/批量操作页面，使用 `src/service/api/user.ts`。

## 14. 注意事项

- `src/router/elegant/*` 和 `src/typings/elegant-router.d.ts` 是生成产物，除非明确需要修复生成结果，否则优先通过页面文件、路由插件配置或生成命令维护。
- 当前 `README.md` 中文内容在本终端读取时出现编码显示异常；英文 README 内容正常，可作为项目介绍参考。
- `src/service/api/user.ts` 与 `src/service/api/index.ts` 的导出不一致，新增统一 API 引用时要留意这一点。
- 默认接口指向 Apifox Mock，接入真实后端时需要调整 `.env.*` 的 `VITE_SERVICE_BASE_URL`、状态码约定和 token 刷新逻辑。
- 默认静态权限路由会读取前端路由 meta；如果切换 `VITE_AUTH_ROUTE_MODE=dynamic`，后端需要返回符合项目类型定义的路由结构。
- `pnpm lint` 会自动修复文件，运行前确认工作区已有改动是否允许被格式化。
