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
  var item = [{"id":"n001","title":"社区内容规范更新说明","content":"<h2>内容规范更新</h2><p>请保持友善交流，发布内容时选择准确板块。</p>","status":"published","top":1,"publishTime":"2026-08-18 08:00:00","createTime":"2026-08-17 16:00:00","updateTime":"2026-08-18 08:00:00","creatorId":"0","creatorName":"林知夏"},{"id":"n002","title":"八月功能体验反馈征集","content":"<p>欢迎通过反馈渠道提交使用建议，我们会统一整理。</p>","status":"published","top":0,"publishTime":"2026-08-15 10:00:00","createTime":"2026-08-14 15:00:00","updateTime":"2026-08-15 10:00:00","creatorId":"2","creatorName":"陈知行"},{"id":"n003","title":"富文本内容发布提示","content":"<p>上传图片前请确认内容清晰且来源适合公开展示。</p>","status":"published","top":0,"publishTime":"2026-08-10 09:00:00","createTime":"2026-08-09 18:00:00","updateTime":"2026-08-10 09:00:00","creatorId":"1","creatorName":"周景行"},{"id":"n004","title":"演示环境数据说明","content":"<p>当前演示使用固定数据基线，写操作成功后重新查询会恢复。</p>","status":"published","top":1,"publishTime":"2026-08-01 12:00:00","createTime":"2026-08-01 10:00:00","updateTime":"2026-08-01 12:00:00","creatorId":"2","creatorName":"陈知行"},{"id":"n005","title":"九月社区活动预告","content":"<p>活动安排仍在整理中。</p>","status":"draft","top":0,"createTime":"2026-08-16 11:00:00","updateTime":"2026-08-16 11:00:00","creatorId":"2","creatorName":"陈知行"},{"id":"n006","title":"七月维护完成通知","content":"<p>维护已经完成，相关功能恢复正常。</p>","status":"archived","top":0,"publishTime":"2026-07-05 08:00:00","createTime":"2026-07-04 18:00:00","updateTime":"2026-08-02 08:00:00","creatorId":"1","creatorName":"周景行"}].find(function (row) { return row.id === String(param('id')); }); item ? respond(item) : respond(null, '1000', '公告不存在');
}

main();
