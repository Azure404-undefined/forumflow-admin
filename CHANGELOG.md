# 更新日志

本文件记录 ForumFlow 社区内容管理平台的重要版本变化。

日志采用“未发布 / 新增 / 变更 / 修复”结构；工程底座的历史版本请参阅 README 中的“技术来源与致谢”。

## [未发布]

当前暂无未发布变更。

## [2.1.0] - 2026-08-19

### 新增

- 完成用户、角色、帖子、板块、评论、举报、公告、系统配置和个人中心等业务模块。
- 建立 Super、Admin、User 三种身份的静态路由 RBAC、按钮权限码和受保护账号规则。
- 提供 68 个 Apifox 固定 Mock 脚本，覆盖四个登录身份、分页筛选和跨模块关联数据验证。
- 接入 WangEditor 与 DOMPurify，支持富文本编辑、安全净化和受限 iframe 展示。
- 提供桌面端与 390px 级移动端布局，普通用户页面使用只读卡片视图。

### 变更

- 产品品牌统一为 ForumFlow，应用固定为中文体验并更新登录页、Logo、标题、水印、页脚和关于页。
- 重写中英文 README，补充在线演示、演示账号、权限矩阵、固定数据机制、项目截图和个人实现说明。
- 将 Apifox 演示数据整理为固定且相互关联的基线；写操作用于交互演示，重新查询后恢复基线。

### 修复

- 修复管理员可操作高权限账号、普通用户可见写操作入口和越权直接访问等权限边界问题。
- 修复普通用户帖子、板块和公告筛选及移动端横向溢出问题。
- 放行 Iconify 主 API 与两个备用 API 的 CSP `connect-src`，恢复生产环境运行时图标加载。

### 部署

- 增加 Vercel History 路由回退、CSP、`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy` 和 `Permissions-Policy`。
- 发布正式演示地址：[forumflow-admin.vercel.app](https://forumflow-admin.vercel.app/)。

[未发布]: https://github.com/Azure404-undefined/forumflow-admin/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/Azure404-undefined/forumflow-admin/releases/tag/v2.1.0
