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
  var permissions = {"R_SUPER":["user:create","user:update","user:delete","user:reset-password","user:assign-role","user:update-status","role:create","role:update","role:delete","role:assign-permission","role:update-status","post:create","post:update","post:delete","post:audit","post:top","post:essence","forum:create","forum:update","forum:delete","forum:move","comment:update","comment:delete","comment:audit","report:handle","notice:create","notice:update","notice:delete","notice:publish","notice:top","config:update"],"R_ADMIN":["user:create","user:update","user:delete","user:reset-password","user:assign-role","user:update-status","post:create","post:update","post:delete","post:audit","post:top","post:essence","forum:create","forum:update","forum:delete","forum:move","comment:update","comment:delete","comment:audit","report:handle","notice:create","notice:update","notice:delete","notice:publish","notice:top"],"R_USER_COMMON":[]}; var value = permissions[String(param('id'))];
  value ? respond(value) : respond(null, '1000', '角色不存在');
}

main();
