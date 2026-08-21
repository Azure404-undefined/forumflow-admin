# ForumFlow 仓库协作指南

本文档供在本仓库中工作的自动化代理与开发者使用。开始任务前先阅读本文档，并以当前源码、`package.json`、环境配置和 Git 状态为最终依据。

## 1. 项目定位

- 项目名称：ForumFlow 社区内容管理平台。
- 根包名与版本：`forumflow-admin@2.1.0`。
- 在线演示：<https://forumflow-admin.vercel.app/>。
- 技术栈：Vue 3、TypeScript、Vite、Element Plus、Pinia、Vue Router、UnoCSS、pnpm workspace。
- 业务范围：数据看板、用户与角色、帖子、板块、评论、举报、公告、系统配置和个人中心。
- 工程基础来自 SoybeanAdmin ElementPlus；保留 MIT 来源和真实依赖名称，但产品界面与项目说明统一使用 ForumFlow。
- 当前版本面向求职作品展示，重点是业务页面、类型契约、RBAC、固定 Apifox 数据、富文本安全和移动端适配。

## 2. 关键目录

- `src/views/`：业务页面；`_builtin` 是工程底座内置页面。
- `src/service/api/`：页面实际调用的业务接口。
- `src/typings/api/`：API 参数与响应类型契约。
- `src/constants/auth.ts`：角色、路由角色矩阵和按钮权限码的唯一策略来源。
- `src/router/`：路由创建、守卫、菜单过滤和生成文件。
- `src/store/`：认证、路由、标签页、主题和应用状态。
- `src/components/common/safeContend.vue`：DOMPurify 富文本安全展示组件。
- `apifox-mock/data/`：固定演示数据的唯一来源。
- `apifox-mock/scripts/`：生成后的逐接口 Apifox Mock 脚本。
- `apifox-mock/tools/`：脚本生成与关联验证工具。
- `.github/workflows/ci.yml`：GitHub Actions 质量检查。
- `vercel.json`：SPA 回退、CSP 和安全响应头。

## 3. 运行环境与命令

- Node.js：`>=20.19.0`。
- pnpm：`>=8.7.0`；仓库声明版本为 `pnpm@10.30.3`。
- 依赖安装：`pnpm install --frozen-lockfile`。
- 本地开发：`pnpm dev`。
- 生产模式开发：`pnpm dev:prod`。
- 生产构建：`pnpm build`。
- 构建预览：`pnpm preview`。
- 类型检查：`pnpm typecheck`。
- 只读代码检查：`pnpm exec eslint .`。
- 自动修复代码检查：`pnpm lint`。
- Mock 验证：`node apifox-mock/tools/verify.mjs`。
- Mock 重新生成：`node apifox-mock/tools/generate.mjs`。
- 路由生成：`pnpm gen-route`。
- 中文交互式提交：`pnpm commit:zh`。

提交或交付前固定执行：

```bash
pnpm typecheck
pnpm exec eslint .
pnpm build
node apifox-mock/tools/verify.mjs
```

## 4. 代码修改约束

- 开始工作前执行 `git status --short --branch`，保留用户已有修改，不覆盖或回退无关文件。
- API 路径、请求参数、响应结构、Token、角色值和权限码保持兼容，除非任务明确要求调整契约。
- 第三方依赖版本保持现状，除非任务明确要求升级或新增依赖。
- 应用保持中文单语言体验，不重新启用语言切换入口。
- 业务界面不重新引入旧产品品牌；上游来源只保留在许可证、技术来源或真实依赖名称中。
- 浏览器端 `VITE_*` 配置视为公开信息；服务端密钥、个人访问令牌和私有凭据不得写入源码或文档。
- `node_modules/`、`dist/`、本地环境文件和个人学习资料不进入 Git。
- 只修改与当前任务直接相关的文件，避免把格式化、生成文件和业务修改混入同一提交。

## 5. 路由与权限

- 权限模式固定为 `VITE_AUTH_ROUTE_MODE=static`。
- 角色固定为 `R_SUPER`、`R_ADMIN`、`R_USER_COMMON`。
- `ROUTE_ROLE_MAP` 控制菜单和直接 URL 访问。
- `PERMISSION_CODES` 控制新增、编辑、删除、审核、状态和批量操作。
- `useAuth().hasAuth` 的权限数组表示满足任意一项；`hasAllAuth` 表示全部满足。
- `R_SUPER` 自动拥有全部按钮权限。
- `R_ADMIN` 可以管理用户、帖子、板块、评论、举报和公告，但用户管理只允许操作普通用户。
- `R_USER_COMMON` 没有写权限，只查看已发布帖子、启用板块和已发布公告。
- 当前登录账号、超级管理员和管理员账号的删除、禁用、重置与批量选择保护不得弱化。
- 页面隐藏写操作的同时，继续保留查询参数和业务判断的数据范围约束。

生成文件：

- `src/router/elegant/routes.ts`
- `src/router/elegant/imports.ts`
- `src/router/elegant/transform.ts`
- `src/typings/elegant-router.d.ts`

不要直接维护生成文件。新增、删除或移动页面后使用 `pnpm gen-route`，再检查生成差异是否仅包含预期路由。

## 6. API 与固定 Mock

- 默认响应包装为 `{ code, msg, data }`，成功码为 `0000`。
- `Api.Auth.UserInfo` 保持 `{ userId, userName, roles, buttons }`。
- Token 由请求封装写入 `Authorization`，身份映射由 Apifox Mock 根据固定 Token 返回。
- `apifox-mock/data` 是固定数据的唯一编辑入口；生成脚本不手工维护重复数据。
- 修改数据后先运行 `generate.mjs`，再运行 `verify.mjs`。
- 当前验证基线为 68 个脚本、4 个身份、12 名用户、12 条帖子、18 条评论及全部关联数据。
- 列表脚本必须先筛选、再计算 `total`、最后分页；空字符串不参与筛选，`0` 和 `1` 等状态值不得被当作空值。
- Mock 写操作用于展示交互反馈，重新查询后恢复固定基线；不要描述为跨请求持久化 CRUD。
- `/profile`、看板、帖子、评论和行为记录必须与当前 Token 对应同一用户及关联 ID。

## 7. 富文本与部署安全

- WangEditor 负责编辑，展示端统一经过 DOMPurify。
- 评论展示移除 iframe；帖子和公告只保留 HTTPS 的 `player.bilibili.com` iframe。
- 使用 `v-html` 时必须通过统一安全组件，避免页面自行渲染未净化 HTML。
- 保留 Vercel 的 SPA rewrite，保证业务路由可以直接打开和刷新。
- CSP 的 `connect-src` 需要保留 Apifox Mock 与 Iconify 主、备用 API。
- 当前 Iconify 在线来源为 `api.iconify.design`、`api.simplesvg.com`、`api.unisvg.com`。
- 调整 CSP、图片、视频、iframe 或上传来源后，在生产域名检查 Console 和 Network。
- 前端 RBAC 只负责展示和交互隔离；接入真实后端时仍需服务端鉴权、数据范围校验、审计、持久化和上传检查。

## 8. Git 与交付流程

- 从最新 `main` 创建任务分支，分支前缀使用 `feat/`、`fix/`、`docs/`、`refactor/`、`ci/` 或 `chore/`。
- 推荐流程：更新 `main` → 创建任务分支 → 开发 → 本地四项检查 → 提交 → push 任务分支 → Pull Request → CI → 合并 `main` → Vercel。
- 提交信息使用 Conventional Commits，例如 `docs(project): update repository guidelines`。
- `pre-commit` 会运行类型检查、自动修复 Lint 和差异检查；提交后再次确认工作区状态。
- `main` 不使用强制推送，不覆盖公开历史；已公开提交需要撤销时优先使用 `git revert`。
- 提交、push、创建 PR、打标签和部署属于独立动作，只在任务或用户明确要求时执行。
- push 任务分支不会自动创建 PR；PR 应以 `main` 为 base、任务分支为 compare。
- PR CI 绿色并复核 Files changed 后再合并；文档或多个整理提交优先使用 Squash and merge。

## 9. 验收重点

- Super 可以访问并操作全部业务模块。
- Admin 看不到角色管理和系统配置，只能管理普通用户。
- User 只看到已发布帖子、启用板块和已发布公告，没有写操作入口。
- 越权直接访问进入 403，切换账号后旧菜单和旧标签页被清理。
- Apifox 数据连续刷新保持固定且引用关系一致。
- 富文本危险内容被净化，iframe 域名限制生效。
- 1280×720、1440×900 和 390×844 下没有明显横向溢出。
- 浏览器标题、Logo、水印、页脚、关于页和 README 使用 ForumFlow 品牌。
- Vercel 直链刷新、安全响应头、Iconify 图标和 Apifox 请求正常。
