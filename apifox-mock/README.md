# Apifox 固定演示数据脚本包

## 用途

本目录为当前前端业务接口提供固定、可重复、相互关联的 Apifox Mock 脚本。`data` 是唯一数据来源，`tools/generate.mjs` 会把数据内联到 `scripts` 下的自包含脚本，`manifest.json` 记录接口与脚本的对应关系。

演示数据为固定基线。新增、编辑、删除、审核、上传等写操作用于展示交互反馈，统一返回确定性成功响应；刷新或重新查询后会恢复固定基线，不表示跨请求持久化。

## 账号

Soybean / 123456 / R_SUPER
Super / 123456 / R_SUPER
Admin / 123456 / R_ADMIN
User / 123456 / R_USER_COMMON

Token 保留为固定 opaque token，脚本不会解析其中的 JWT 时间字段。

## 生成和验证

在仓库根目录执行：

node apifox-mock/tools/generate.mjs
node apifox-mock/tools/verify.mjs

修改演示数据时只编辑 `data/*.json`，随后重新执行生成器和验证器。生成后的单个 `.js` 文件可直接复制到对应 Apifox 接口的 Mock 脚本区域。

## Apifox 配置顺序

1. `POST /auth/login`
2. `GET /auth/getUserInfo`
3. `POST /auth/refreshToken`
4. `/profile` 及其关联接口
5. 用户、角色和权限树
6. 板块
7. 帖子和评论
8. 举报和公告
9. dashboard 和配置
10. 上传接口与其余写操作

每个接口的 HTTP 方法、路径、脚本文件和配置备注都在 `manifest.json`。同一路径存在多个方法时，应分别配置到对应的方法接口，特别是 `GET/POST/DELETE /notices`。

## 数据约束

用户、作者、评论人和举报人都使用固定 userId；作者昵称来自用户资料；帖子板块、评论帖子、举报目标、看板热门项均引用真实固定 ID。日期范围为 2026-05-20 至 2026-08-18，头像使用固定 DiceBear seed。

Mock 脚本按 [Apifox Mock 脚本说明](https://docs.apifox.com/mock-scripts)中的 `fox.mockRequest`、`fox.mockResponse` API 编写。每个生成脚本均自包含，不依赖变量共享、模块导入或外部运行时。
