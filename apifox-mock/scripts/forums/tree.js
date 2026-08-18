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
  var source = [{"id":"f1","name":"技术交流","description":"前端、后端与工程实践","parentId":null,"sort":1,"status":1,"createTime":"2026-05-20 10:00:00","postCount":2,"createUser":"Soybean","updateTime":"2026-08-10 12:00:00","updateUser":"Admin","svgIcon":"https://api.dicebear.com/9.x/icons/svg?seed=tech"},{"id":"f2","name":"前端开发","description":"Vue、TypeScript 与浏览器技术","parentId":"f1","sort":1,"status":1,"createTime":"2026-05-20 10:10:00","postCount":2,"createUser":"Soybean","updateTime":"2026-08-11 09:00:00","updateUser":"Admin","svgIcon":"https://api.dicebear.com/9.x/icons/svg?seed=frontend"},{"id":"f3","name":"后端与架构","description":"服务端、数据与系统设计","parentId":"f1","sort":2,"status":1,"createTime":"2026-05-20 10:20:00","postCount":2,"createUser":"Soybean","updateTime":"2026-08-12 09:00:00","updateUser":"Admin","svgIcon":"https://api.dicebear.com/9.x/icons/svg?seed=backend"},{"id":"f4","name":"社区生活","description":"分享日常与成长记录","parentId":null,"sort":2,"status":1,"createTime":"2026-05-21 10:00:00","postCount":2,"createUser":"Super","updateTime":"2026-08-13 09:00:00","updateUser":"Admin","svgIcon":"https://api.dicebear.com/9.x/icons/svg?seed=community"},{"id":"f5","name":"作品展示","description":"项目复盘与作品交流","parentId":"f4","sort":1,"status":1,"createTime":"2026-05-21 10:10:00","postCount":2,"createUser":"Super","updateTime":"2026-08-14 09:00:00","updateUser":"Admin","svgIcon":"https://api.dicebear.com/9.x/icons/svg?seed=showcase"},{"id":"f6","name":"闲聊茶馆","description":"轻松交流区","parentId":"f4","sort":2,"status":0,"createTime":"2026-05-21 10:20:00","postCount":2,"createUser":"Super","updateTime":"2026-08-15 09:00:00","updateUser":"Admin","svgIcon":"https://api.dicebear.com/9.x/icons/svg?seed=chat"}]; var nodes = source.map(function (item) { var copy = Object.assign({}, item); copy.children = []; return copy; });
  var map = {}; nodes.forEach(function (node) { map[node.id] = node; }); var roots = [];
  nodes.forEach(function (node) { if (node.parentId && map[node.parentId]) map[node.parentId].children.push(node); else roots.push(node); });
  function sortTree(items) { items.sort(function (a, b) { return a.sort - b.sort; }); items.forEach(function (item) { sortTree(item.children); }); }
  sortTree(roots); respond(roots);
}

main();
