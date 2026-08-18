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
  var item = [{"targetId":"p008","targetType":"post","targetTitle":"Vite 构建产物分析记录","reportCount":2,"latestReason":"misinformation","status":"pending","children":[{"id":"r001","reporterId":"3","reporterName":"苏念","reason":"misinformation","reasonDesc":"部分体积对比缺少数据来源","createTime":"2026-08-07 08:30:00"},{"id":"r002","reporterId":"5","reporterName":"沐雨","reason":"other","reasonDesc":"建议复核文章中的结论","createTime":"2026-08-07 09:10:00"}]},{"targetId":"c007","targetType":"comment","targetTitle":"期待补充服务端校验示例。","reportCount":1,"latestReason":"spam","status":"pending","children":[{"id":"r003","reporterId":"7","reporterName":"星野","reason":"spam","reasonDesc":"疑似重复评论","createTime":"2026-08-13 10:20:00"}]},{"targetId":"p004","targetType":"post","targetTitle":"前后端权限模型的边界","reportCount":1,"latestReason":"other","status":"approved","handlerId":"2","handlerName":"陈知行","handleTime":"2026-08-14 09:00:00","children":[{"id":"r004","reporterId":"8","reporterName":"晴川","reason":"other","reasonDesc":"标题与正文范围需要确认","createTime":"2026-08-13 11:00:00"}]},{"targetId":"c013","targetType":"comment","targetTitle":"建议给出分包前后对比。","reportCount":1,"latestReason":"offensive","status":"rejected","handlerId":"1","handlerName":"周景行","handleTime":"2026-08-08 13:00:00","children":[{"id":"r005","reporterId":"9","reporterName":"南枝","reason":"offensive","reasonDesc":"语气可能引发争议","createTime":"2026-08-07 12:00:00"}]},{"targetId":"p012","targetType":"post","targetTitle":"第一次参加线下技术交流会","reportCount":1,"latestReason":"spam","status":"approved","handlerId":"2","handlerName":"陈知行","handleTime":"2026-07-14 10:00:00","children":[{"id":"r006","reporterId":"10","reporterName":"白榆","reason":"spam","reasonDesc":"包含较多活动信息","createTime":"2026-07-13 08:00:00"}]}].find(function (row) { return row.targetId === String(param('id')); }); item ? respond(item) : respond(null, '1000', '举报记录不存在');
}

main();
