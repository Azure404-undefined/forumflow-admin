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
  var items = [{"id":"p001","title":"Vue 3 组合式 API 的工程化实践","content":"<h2>组合式 API 实践</h2><p>从职责拆分、类型约束和复用边界三个角度整理页面逻辑。</p>","images":[],"authorId":"0","authorName":"林知夏","authorAvatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=Soybean","forumId":"f2","forumName":"前端开发","status":"published","top":1,"essence":1,"viewCount":1260,"likeCount":186,"commentCount":2,"createTime":"2026-08-18 08:30:00","updateTime":"2026-08-18 09:10:00"},{"id":"p002","title":"TypeScript 类型契约如何减少联调成本","content":"<p>以请求参数、响应模型和表单数据为例，说明类型契约的价值。</p>","images":[],"authorId":"2","authorName":"陈知行","authorAvatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=Admin","forumId":"f2","forumName":"前端开发","status":"published","top":0,"essence":1,"viewCount":980,"likeCount":132,"commentCount":2,"createTime":"2026-08-16 14:20:00","updateTime":"2026-08-17 10:00:00"},{"id":"p003","title":"接口分页与筛选的统一设计","content":"<p>先筛选、再统计、最后分页，可以避免页码和总数不一致。</p>","images":[],"authorId":"1","authorName":"周景行","authorAvatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=Super","forumId":"f3","forumName":"后端与架构","status":"published","top":0,"essence":0,"viewCount":760,"likeCount":88,"commentCount":2,"createTime":"2026-08-14 11:00:00","updateTime":"2026-08-14 11:40:00"},{"id":"p004","title":"前后端权限模型的边界","content":"<p>前端权限负责展示体验，服务端权限负责数据与操作边界。</p>","images":[],"authorId":"6","authorName":"江河","authorAvatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=JiangHe","forumId":"f3","forumName":"后端与架构","status":"pending","top":0,"essence":0,"viewCount":210,"likeCount":24,"commentCount":1,"createTime":"2026-08-13 09:15:00","updateTime":"2026-08-13 09:15:00"},{"id":"p005","title":"如何组织一个可演示的后台项目","content":"<p>稳定数据、清晰入口和可复现构建，是作品展示的基础。</p>","images":[],"authorId":"3","authorName":"苏念","authorAvatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=User","forumId":"f5","forumName":"作品展示","status":"published","top":1,"essence":1,"viewCount":1450,"likeCount":205,"commentCount":2,"createTime":"2026-08-12 18:30:00","updateTime":"2026-08-15 16:00:00"},{"id":"p006","title":"我的第一个管理后台复盘","content":"<p>记录从页面实现到接口联调、权限整理和上线准备的过程。</p>","images":[],"authorId":"4","authorName":"林溪","authorAvatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=LinXi","forumId":"f5","forumName":"作品展示","status":"published","top":0,"essence":0,"viewCount":830,"likeCount":97,"commentCount":2,"createTime":"2026-08-10 13:00:00","updateTime":"2026-08-10 14:00:00"},{"id":"p007","title":"社区运营周报：内容质量观察","content":"<p>本周优质内容增加，待处理举报保持在较低水平。</p>","images":[],"authorId":"2","authorName":"陈知行","authorAvatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=Admin","forumId":"f1","forumName":"技术交流","status":"published","top":0,"essence":0,"viewCount":520,"likeCount":66,"commentCount":1,"createTime":"2026-08-08 10:30:00","updateTime":"2026-08-08 10:30:00"},{"id":"p008","title":"Vite 构建产物分析记录","content":"<p>通过按路由分包和按需加载观察首屏资源变化。</p>","images":[],"authorId":"8","authorName":"晴川","authorAvatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=QingChuan","forumId":"f1","forumName":"技术交流","status":"rejected","top":0,"essence":0,"viewCount":115,"likeCount":12,"commentCount":1,"createTime":"2026-08-06 15:40:00","updateTime":"2026-08-07 09:00:00"},{"id":"p009","title":"夏日摄影分享","content":"<p>分享几张傍晚散步时拍摄的城市光影。</p>","images":["https://picsum.photos/seed/summer-demo/800/450"],"authorId":"7","authorName":"星野","authorAvatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=XingYe","forumId":"f4","forumName":"社区生活","status":"published","top":0,"essence":0,"viewCount":640,"likeCount":112,"commentCount":1,"createTime":"2026-08-04 19:10:00","updateTime":"2026-08-04 19:10:00"},{"id":"p010","title":"保持专注的三个小方法","content":"<p>拆小任务、固定时间段、及时记录完成反馈。</p>","images":[],"authorId":"5","authorName":"沐雨","authorAvatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=MuYu","forumId":"f4","forumName":"社区生活","status":"published","top":0,"essence":0,"viewCount":710,"likeCount":128,"commentCount":2,"createTime":"2026-07-30 08:20:00","updateTime":"2026-07-30 08:20:00"},{"id":"p011","title":"周末读书记录","content":"<p>整理一本技术沟通主题书籍的阅读笔记。</p>","images":[],"authorId":"10","authorName":"白榆","authorAvatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=BaiYu","forumId":"f6","forumName":"闲聊茶馆","status":"draft","top":0,"essence":0,"viewCount":20,"likeCount":2,"commentCount":1,"createTime":"2026-07-20 16:45:00","updateTime":"2026-07-21 09:00:00"},{"id":"p012","title":"第一次参加线下技术交流会","content":"<p>记录主题分享、现场讨论和个人收获。</p>","images":[],"authorId":"11","authorName":"晚风","authorAvatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=WanFeng","forumId":"f6","forumName":"闲聊茶馆","status":"rejected","top":0,"essence":0,"viewCount":460,"likeCount":58,"commentCount":1,"createTime":"2026-07-12 20:00:00","updateTime":"2026-07-14 10:00:00"}]; var title = text(param('title')); var author = text(param('authorName')); var forumId = param('forumId'); var status = param('status'); var top = param('top'); var essence = param('essence'); var startTime = param('startTime'); var endTime = param('endTime');
  items = items.filter(function (item) { return (!title || text(item.title).includes(title)) && (!author || text(item.authorName).includes(author)) && (!hasValue(forumId) || item.forumId === String(forumId)) && (!hasValue(status) || item.status === String(status)) && (!hasValue(top) || String(item.top) === String(top)) && (!hasValue(essence) || String(item.essence) === String(essence)) && (!hasValue(startTime) || item.createTime >= String(startTime)) && (!hasValue(endTime) || item.createTime <= String(endTime) + ' 23:59:59'); });
  respond(page(items));
}

main();
