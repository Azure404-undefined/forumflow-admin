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
  respond([{"groupKey":"basic","groupName":"基础设置","items":[{"key":"site_name","value":"Forum Admin Demo","type":"string","label":"站点名称","group":"basic","placeholder":"请输入站点名称"},{"key":"site_description","value":"论坛内容社区后台演示","type":"string","label":"站点描述","group":"basic","placeholder":"请输入站点描述"},{"key":"site_logo","value":"https://api.dicebear.com/9.x/shapes/svg?seed=forum-admin","type":"image","label":"站点标识","group":"basic","helpText":"演示环境使用固定图片地址"}]},{"groupKey":"seo","groupName":"SEO 设置","items":[{"key":"seo_keywords","value":"Vue3,TypeScript,论坛后台","type":"string","label":"关键词","group":"seo"},{"key":"seo_description","value":"论坛内容社区后台管理系统演示","type":"string","label":"页面描述","group":"seo"}]},{"groupKey":"feature","groupName":"功能开关","items":[{"key":"allow_register","value":true,"type":"boolean","label":"允许注册","group":"feature"},{"key":"post_audit","value":true,"type":"boolean","label":"帖子审核","group":"feature"},{"key":"upload_limit_mb","value":10,"type":"number","label":"上传限制（MB）","group":"feature"}]},{"groupKey":"third_party","groupName":"第三方服务","items":[{"key":"analytics_config","value":"{\"enabled\":false,\"provider\":\"demo\"}","type":"json","label":"统计配置","group":"third_party","helpText":"仅作演示，不包含真实密钥"},{"key":"storage_provider","value":"mock","type":"string","label":"存储服务","group":"third_party"}]}]);
}

main();
