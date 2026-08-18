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
  var item = [{"id":"R_SUPER","name":"超级管理员","description":"拥有全部演示权限","status":1,"createTime":"2026-05-20 09:00:00"},{"id":"R_ADMIN","name":"管理员","description":"负责用户与社区内容管理","status":1,"createTime":"2026-05-20 09:10:00"},{"id":"R_USER_COMMON","name":"普通用户","description":"只读浏览公开内容","status":1,"createTime":"2026-05-20 09:20:00"}].find(function (row) { return row.id === String(param('id')); });
  item ? respond(item) : respond(null, '1000', '角色不存在');
}

main();
