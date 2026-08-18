// 由 tools/generate.mjs 生成；数据来源为 apifox-mock/data。

function respond(data, code, msg) {
  fox.mockResponse.setBody({ data: data === undefined ? null : data, code: code || '0000', msg: msg || '请求成功' });
}
function param(name) {
  return fox.mockRequest.getParam(name);
}
function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}
function text(value) {
  return String(value === undefined || value === null ? '' : value).toLowerCase();
}
function page(items) {
  var pageNum = Math.max(1, Number(param('pageNum')) || 1);
  var pageSize = Math.max(1, Number(param('pageSize')) || 10);
  var start = (pageNum - 1) * pageSize;
  return { list: items.slice(start, start + pageSize), total: items.length, pageNum: pageNum, pageSize: pageSize };
}
function authorization() {
  var headers = fox.mockRequest.headers;
  if (!headers) return '';
  if (typeof headers.get === 'function') return headers.get('Authorization') || headers.get('authorization') || '';
  return headers.Authorization || headers.authorization || '';
}

function main() {
  respond([{"id":"user:group","label":"用户管理","children":[{"id":"user:create","label":"新增用户"},{"id":"user:update","label":"编辑用户"},{"id":"user:delete","label":"删除用户"},{"id":"user:reset-password","label":"重置密码"},{"id":"user:assign-role","label":"分配角色"},{"id":"user:update-status","label":"修改状态"}]},{"id":"role:group","label":"角色管理","children":[{"id":"role:create","label":"新增角色"},{"id":"role:update","label":"编辑角色"},{"id":"role:delete","label":"删除角色"},{"id":"role:assign-permission","label":"分配权限"},{"id":"role:update-status","label":"修改状态"}]},{"id":"post:group","label":"帖子管理","children":[{"id":"post:create","label":"新增帖子"},{"id":"post:update","label":"编辑帖子"},{"id":"post:delete","label":"删除帖子"},{"id":"post:audit","label":"审核帖子"},{"id":"post:top","label":"置顶帖子"},{"id":"post:essence","label":"加精帖子"}]},{"id":"forum:group","label":"板块管理","children":[{"id":"forum:create","label":"新增板块"},{"id":"forum:update","label":"编辑板块"},{"id":"forum:delete","label":"删除板块"},{"id":"forum:move","label":"移动板块"}]},{"id":"comment:group","label":"评论管理","children":[{"id":"comment:update","label":"编辑评论"},{"id":"comment:delete","label":"删除评论"},{"id":"comment:audit","label":"审核评论"}]},{"id":"report:group","label":"举报管理","children":[{"id":"report:handle","label":"处理举报"}]},{"id":"notice:group","label":"公告管理","children":[{"id":"notice:create","label":"新增公告"},{"id":"notice:update","label":"编辑公告"},{"id":"notice:delete","label":"删除公告"},{"id":"notice:publish","label":"发布公告"},{"id":"notice:top","label":"置顶公告"}]},{"id":"config:group","label":"系统配置","children":[{"id":"config:update","label":"更新配置"}]}]);
}

main();
