import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = join(root, 'data');
const scriptsDirectory = join(root, 'scripts');

const readJson = async name => JSON.parse(await readFile(join(dataDirectory, name), 'utf8'));
const data = {
  accounts: await readJson('accounts.json'),
  users: await readJson('users.json'),
  roles: await readJson('roles.json'),
  forums: await readJson('forums.json'),
  posts: await readJson('posts.json'),
  comments: await readJson('comments.json'),
  reports: await readJson('reports.json'),
  notices: await readJson('notices.json'),
  configs: await readJson('configs.json'),
  profiles: await readJson('profiles.json'),
  dashboard: await readJson('dashboard.json')
};

const permissionGroups = {
  user: ['user:create', 'user:update', 'user:delete', 'user:reset-password', 'user:assign-role', 'user:update-status'],
  role: ['role:create', 'role:update', 'role:delete', 'role:assign-permission', 'role:update-status'],
  post: ['post:create', 'post:update', 'post:delete', 'post:audit', 'post:top', 'post:essence'],
  forum: ['forum:create', 'forum:update', 'forum:delete', 'forum:move'],
  comment: ['comment:update', 'comment:delete', 'comment:audit'],
  report: ['report:handle'],
  notice: ['notice:create', 'notice:update', 'notice:delete', 'notice:publish', 'notice:top'],
  config: ['config:update']
};
const allPermissions = Object.values(permissionGroups).flat();
const adminPermissions = ['user', 'post', 'forum', 'comment', 'report', 'notice'].flatMap(key => permissionGroups[key]);
const permissionsByRole = { R_SUPER: allPermissions, R_ADMIN: adminPermissions, R_USER_COMMON: [] };

const compact = value => JSON.stringify(value);
const pretty = value => JSON.stringify(value, null, 2);
const responsePrelude = `
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
`;

const entries = [];

async function emit({ method, path, name, file, notes, body, auth = false, verifyParams = {} }) {
  const target = join(scriptsDirectory, file);
  await mkdir(dirname(target), { recursive: true });
  const source = `// 由 tools/generate.mjs 生成；数据来源为 apifox-mock/data。\n${responsePrelude}\nfunction main() {\n${body}\n}\n\nmain();\n`;
  await writeFile(target, source, 'utf8');
  entries.push({ method, path, name, script: `scripts/${file.replaceAll('\\', '/')}`, auth, verifyParams, notes });
}

const accounts = compact(data.accounts);
const users = compact(data.users);
const roles = compact(data.roles);
const forums = compact(data.forums);
const posts = compact(data.posts);
const comments = compact(data.comments);
const reports = compact(data.reports);
const notices = compact(data.notices);
const configs = compact(data.configs);
const profiles = compact(data.profiles);

await emit({
  method: 'POST', path: '/auth/login', name: '账号登录', file: 'auth/login.js', notes: '按 userName 与 password 匹配四个固定账号。',
  verifyParams: { userName: 'Soybean', password: '123456' },
  body: `  var accounts = ${accounts};
  var account = accounts.find(function (item) { return item.userName === param('userName') && item.password === param('password'); });
  if (!account) return respond(null, '1000', '用户名或密码错误');
  respond({ token: account.token, refreshToken: account.refreshToken });`
});

await emit({
  method: 'GET', path: '/auth/getUserInfo', name: '获取登录用户信息', file: 'auth/getUserInfo.js', auth: true,
  notes: 'Bearer Token 固定映射到用户、角色和按钮权限。',
  body: `  var accounts = ${accounts};
  var permissions = ${compact(permissionsByRole)};
  var token = authorization().replace(/^Bearer\\s+/i, '');
  var account = accounts.find(function (item) { return item.token === token; });
  if (!account) return respond(null, '8888', '登录状态无效');
  respond({ userId: account.userId, userName: account.userName, roles: [account.userRole], buttons: permissions[account.userRole] || [] });`
});

await emit({
  method: 'POST', path: '/auth/refreshToken', name: '刷新登录令牌', file: 'auth/refreshToken.js', notes: '按固定 refreshToken 返回原账号令牌组合。',
  verifyParams: { refreshToken: data.accounts[0].refreshToken },
  body: `  var accounts = ${accounts};
  var account = accounts.find(function (item) { return item.refreshToken === param('refreshToken'); });
  if (!account) return respond(null, '8888', '登录状态无效');
  respond({ token: account.token, refreshToken: account.refreshToken });`
});

await emit({
  method: 'GET', path: '/users', name: '用户列表', file: 'users/list.js', auth: true, notes: '支持用户名、昵称、手机号、状态筛选和分页。',
  body: `  var items = ${users};
  var username = text(param('username')); var nickname = text(param('nickname')); var phone = text(param('phone')); var status = param('status');
  items = items.filter(function (item) {
    return (!username || text(item.username).includes(username)) && (!nickname || text(item.nickname).includes(nickname)) && (!phone || text(item.phone).includes(phone)) && (!hasValue(status) || String(item.status) === String(status));
  });
  respond(page(items));`
});
await emit({ method: 'GET', path: '/users/:id', name: '用户详情', file: 'users/detail.js', auth: true, verifyParams: { id: '3' }, notes: '按路径参数 id 返回固定用户。', body: `  var item = ${users}.find(function (row) { return row.id === String(param('id')); });
  item ? respond(item) : respond(null, '1000', '用户不存在');` });

await emit({
  method: 'GET', path: '/roles', name: '角色列表', file: 'roles/list.js', auth: true, notes: '支持角色标识、名称和 0/1 状态筛选。',
  body: `  var items = ${roles}; var id = text(param('id')); var name = text(param('name')); var status = param('status');
  items = items.filter(function (item) { return (!id || text(item.id).includes(id)) && (!name || text(item.name).includes(name)) && (!hasValue(status) || String(item.status) === String(status)); });
  respond(items);`
});
await emit({ method: 'GET', path: '/roles/:id', name: '角色详情', file: 'roles/detail.js', auth: true, verifyParams: { id: 'R_ADMIN' }, notes: '按角色标识返回详情。', body: `  var item = ${roles}.find(function (row) { return row.id === String(param('id')); });
  item ? respond(item) : respond(null, '1000', '角色不存在');` });

const permissionLabels = {
  user: ['用户管理', ['新增用户', '编辑用户', '删除用户', '重置密码', '分配角色', '修改状态']],
  role: ['角色管理', ['新增角色', '编辑角色', '删除角色', '分配权限', '修改状态']],
  post: ['帖子管理', ['新增帖子', '编辑帖子', '删除帖子', '审核帖子', '置顶帖子', '加精帖子']],
  forum: ['板块管理', ['新增板块', '编辑板块', '删除板块', '移动板块']],
  comment: ['评论管理', ['编辑评论', '删除评论', '审核评论']],
  report: ['举报管理', ['处理举报']],
  notice: ['公告管理', ['新增公告', '编辑公告', '删除公告', '发布公告', '置顶公告']],
  config: ['系统配置', ['更新配置']]
};
const permissionTree = Object.entries(permissionGroups).map(([group, codes]) => ({
  id: `${group}:group`,
  label: permissionLabels[group][0],
  children: codes.map((code, index) => ({ id: code, label: permissionLabels[group][1][index] }))
}));
await emit({ method: 'GET', path: '/permissions/tree', name: '权限树', file: 'roles/permission-tree.js', auth: true, notes: '分组节点仅展示；叶节点 id 与前端按钮权限码一致。', body: `  respond(${compact(permissionTree)});` });
await emit({ method: 'GET', path: '/roles/:id/permissions', name: '角色权限', file: 'roles/permissions.js', auth: true, verifyParams: { id: 'R_ADMIN' }, notes: '返回指定角色的叶节点权限码。', body: `  var permissions = ${compact(permissionsByRole)}; var value = permissions[String(param('id'))];
  value ? respond(value) : respond(null, '1000', '角色不存在');` });

await emit({
  method: 'GET', path: '/forums/tree', name: '板块树', file: 'forums/tree.js', auth: true, notes: '由固定平铺数据确定性构建两组父子树。',
  body: `  var source = ${forums}; var nodes = source.map(function (item) { var copy = Object.assign({}, item); copy.children = []; return copy; });
  var map = {}; nodes.forEach(function (node) { map[node.id] = node; }); var roots = [];
  nodes.forEach(function (node) { if (node.parentId && map[node.parentId]) map[node.parentId].children.push(node); else roots.push(node); });
  function sortTree(items) { items.sort(function (a, b) { return a.sort - b.sort; }); items.forEach(function (item) { sortTree(item.children); }); }
  sortTree(roots); respond(roots);`
});
await emit({ method: 'GET', path: '/forums/options', name: '启用板块选项', file: 'forums/options.js', auth: true, notes: '仅返回 status=1 的固定板块。', body: `  respond(${forums}.filter(function (item) { return item.status === 1; }).map(function (item) { return { id: item.id, name: item.name }; }));` });

await emit({
  method: 'GET', path: '/posts', name: '帖子列表', file: 'posts/list.js', auth: true, notes: '支持标题、作者、板块、状态、置顶、加精、日期筛选和分页。',
  body: `  var items = ${posts}; var title = text(param('title')); var author = text(param('authorName')); var forumId = param('forumId'); var status = param('status'); var top = param('top'); var essence = param('essence'); var startTime = param('startTime'); var endTime = param('endTime');
  items = items.filter(function (item) { return (!title || text(item.title).includes(title)) && (!author || text(item.authorName).includes(author)) && (!hasValue(forumId) || item.forumId === String(forumId)) && (!hasValue(status) || item.status === String(status)) && (!hasValue(top) || String(item.top) === String(top)) && (!hasValue(essence) || String(item.essence) === String(essence)) && (!hasValue(startTime) || item.createTime >= String(startTime)) && (!hasValue(endTime) || item.createTime <= String(endTime) + ' 23:59:59'); });
  respond(page(items));`
});
await emit({ method: 'GET', path: '/posts/:id', name: '帖子详情', file: 'posts/detail.js', auth: true, verifyParams: { id: 'p001' }, notes: '按路径参数 id 返回列表中的同一帖子。', body: `  var item = ${posts}.find(function (row) { return row.id === String(param('id')); }); item ? respond(item) : respond(null, '1000', '帖子不存在');` });

await emit({
  method: 'GET', path: '/comments', name: '评论列表', file: 'comments/list.js', auth: true, notes: '普通列表保留二级回复；按作者筛选时会同时匹配回复。',
  body: `  var roots = ${comments}; var postItems = ${posts}; var flat = [];
  roots.forEach(function (root) { flat.push(root); (root.children || []).forEach(function (child) { flat.push(child); }); });
  var author = text(param('authorName')); var postId = param('postId'); var status = param('status'); var startTime = param('startTime'); var endTime = param('endTime');
  var items = author ? flat : roots;
  items = items.filter(function (item) { return (!author || text(item.authorName).includes(author)) && (!hasValue(postId) || item.postId === String(postId)) && (!hasValue(status) || item.status === String(status)) && (!hasValue(startTime) || item.createTime >= String(startTime)) && (!hasValue(endTime) || item.createTime <= String(endTime) + ' 23:59:59'); }).map(function (item) { var post = postItems.find(function (row) { return row.id === item.postId; }); return Object.assign({}, item, { postTitle: post ? post.title : '' }); });
  respond(page(items));`
});
await emit({ method: 'GET', path: '/comments/:id', name: '评论详情', file: 'comments/detail.js', auth: true, verifyParams: { id: 'c002' }, notes: '可查询一级评论或二级回复。', body: `  var roots = ${comments}; var postItems = ${posts}; var flat = []; roots.forEach(function (root) { flat.push(root); (root.children || []).forEach(function (child) { flat.push(child); }); }); var item = flat.find(function (row) { return row.id === String(param('id')); }); var post = item && postItems.find(function (row) { return row.id === item.postId; }); item ? respond(Object.assign({}, item, { postTitle: post ? post.title : '' })) : respond(null, '1000', '评论不存在');` });

await emit({
  method: 'GET', path: '/reports', name: '举报聚合列表', file: 'reports/list.js', auth: true, notes: '支持状态、目标类型、举报人、日期筛选和分页。',
  body: `  var items = ${reports}; var status = param('status'); var targetType = param('targetType'); var reporter = text(param('reporterName')); var startTime = param('startTime'); var endTime = param('endTime');
  items = items.filter(function (item) { var children = item.children || []; return (!hasValue(status) || item.status === String(status)) && (!hasValue(targetType) || item.targetType === String(targetType)) && (!reporter || children.some(function (child) { return text(child.reporterName).includes(reporter); })) && (!hasValue(startTime) || children.some(function (child) { return child.createTime >= String(startTime); })) && (!hasValue(endTime) || children.some(function (child) { return child.createTime <= String(endTime) + ' 23:59:59'; })); }); respond(page(items));`
});
await emit({ method: 'GET', path: '/reports/:id', name: '举报聚合详情', file: 'reports/detail.js', auth: true, verifyParams: { id: 'p008' }, notes: 'id 对应聚合项 targetId。', body: `  var item = ${reports}.find(function (row) { return row.targetId === String(param('id')); }); item ? respond(item) : respond(null, '1000', '举报记录不存在');` });

await emit({
  method: 'GET', path: '/notices', name: '公告列表', file: 'notices/list.js', auth: true, notes: '支持标题、状态、置顶、日期筛选和分页。',
  body: `  var items = ${notices}; var title = text(param('title')); var status = param('status'); var top = param('top'); var startTime = param('startTime'); var endTime = param('endTime');
  items = items.filter(function (item) { return (!title || text(item.title).includes(title)) && (!hasValue(status) || item.status === String(status)) && (!hasValue(top) || String(item.top) === String(top)) && (!hasValue(startTime) || item.createTime >= String(startTime)) && (!hasValue(endTime) || item.createTime <= String(endTime) + ' 23:59:59'); }); respond(page(items));`
});
await emit({ method: 'GET', path: '/notices/:id', name: '公告详情', file: 'notices/detail.js', auth: true, verifyParams: { id: 'n001' }, notes: '按路径参数 id 返回安全渲染所需的固定富文本。', body: `  var item = ${notices}.find(function (row) { return row.id === String(param('id')); }); item ? respond(item) : respond(null, '1000', '公告不存在');` });

await emit({ method: 'GET', path: '/system/configs', name: '读取系统配置', file: 'configs/get.js', auth: true, notes: '固定返回 basic、seo、feature、third_party 四组。', body: `  respond(${configs});` });
await emit({ method: 'GET', path: '/dashboard', name: '首页看板', file: 'dashboard/get.js', auth: true, notes: '统计值与固定用户、帖子、评论和举报集合一致。', body: `  respond(${compact(data.dashboard)});` });

function profileBody(field, paged = false) {
  return `  var accounts = ${accounts}; var records = ${profiles}; var token = authorization().replace(/^Bearer\\s+/i, ''); var account = accounts.find(function (item) { return item.token === token; }); var record = account && records.find(function (item) { return item.userId === account.userId; });
  if (!record) return respond(null, '8888', '登录状态无效');
  ${paged ? `var value = record.${field} || []; respond(page(value));` : `respond(record.${field});`}`;
}
await emit({ method: 'GET', path: '/profile', name: '个人资料', file: 'profiles/profile.js', auth: true, notes: '根据 Authorization 返回当前固定账号资料。', body: profileBody('profile') });
await emit({ method: 'GET', path: '/profile/stats', name: '个人统计', file: 'profiles/stats.js', auth: true, notes: '与当前固定账号动态保持一致。', body: profileBody('stats') });
for (const [path, field, label] of [['timeline', 'timeline', '个人动态'], ['history', 'history', '浏览历史'], ['favorites', 'favorites', '个人收藏'], ['logs', 'logs', '操作日志']]) {
  await emit({ method: 'GET', path: `/profile/${path}`, name: label, file: `profiles/${path}.js`, auth: true, notes: '根据 Authorization 分页返回当前账号固定记录。', body: profileBody(field, true) });
}
await emit({ method: 'GET', path: '/profile/sessions', name: '登录会话', file: 'profiles/sessions.js', auth: true, notes: '根据 Authorization 返回当前账号固定设备。', body: profileBody('sessions') });
await emit({ method: 'GET', path: '/profile/privacy', name: '隐私设置', file: 'profiles/privacy.js', auth: true, notes: '根据 Authorization 返回当前账号固定隐私设置。', body: profileBody('privacy') });

const successEndpoints = [
  ['POST', '/users', '新增用户', 'users/create.js'], ['PUT', '/users/:id', '编辑用户', 'users/update.js'], ['DELETE', '/users/:id', '删除用户', 'users/delete.js'], ['PUT', '/users/:id/resetPwd', '重置用户密码', 'users/reset-password.js'], ['PUT', '/users/:id/status', '修改用户状态', 'users/update-status.js'], ['PUT', '/users/:id/roles', '分配用户角色', 'users/assign-roles.js'],
  ['POST', '/roles', '新增角色', 'roles/create.js'], ['PUT', '/roles/:id', '编辑角色', 'roles/update.js'], ['DELETE', '/roles/:id', '删除角色', 'roles/delete.js'], ['PUT', '/roles/:id/permissions', '分配角色权限', 'roles/assign-permissions.js'],
  ['PUT', '/forums/:id', '编辑板块', 'forums/update.js'], ['DELETE', '/forums/:id', '删除板块', 'forums/delete.js'], ['POST', '/forums/move', '移动板块', 'forums/move.js'],
  ['POST', '/posts', '新增帖子', 'posts/create.js'], ['PUT', '/posts/:id', '编辑帖子', 'posts/update.js'], ['DELETE', '/posts/:id', '删除帖子', 'posts/delete.js'], ['POST', '/posts/batch/delete', '批量删除帖子', 'posts/batch-delete.js'], ['POST', '/posts/batch/audit', '批量审核帖子', 'posts/batch-audit.js'], ['PUT', '/posts/:id/top', '帖子置顶', 'posts/top.js'], ['PUT', '/posts/:id/essence', '帖子加精', 'posts/essence.js'],
  ['DELETE', '/comments/:id', '删除评论', 'comments/delete.js'], ['POST', '/comments/batch/delete', '批量删除评论', 'comments/batch-delete.js'], ['POST', '/comments/batch/audit', '批量审核评论', 'comments/batch-audit.js'], ['PUT', '/comments/:id', '编辑评论', 'comments/update.js'],
  ['POST', '/reports/handle', '处理举报', 'reports/handle.js'],
  ['POST', '/notices', '新增公告', 'notices/create.js'], ['PUT', '/notices/:id', '编辑公告', 'notices/update.js'], ['DELETE', '/notices/:id', '删除公告', 'notices/delete.js'], ['DELETE', '/notices', '批量删除公告', 'notices/batch-delete.js'], ['POST', '/notices/:id/publish', '发布公告', 'notices/publish.js'], ['POST', '/notices/:id/top', '公告置顶', 'notices/top.js'],
  ['PUT', '/system/configs', '保存系统配置', 'configs/save.js'], ['PUT', '/profile', '更新个人资料', 'profiles/update.js'], ['PUT', '/profile/password', '修改密码', 'profiles/password.js'], ['PUT', '/profile/privacy', '更新隐私设置', 'profiles/update-privacy.js']
];
for (const [method, path, name, file] of successEndpoints) {
  await emit({ method, path, name, file, auth: true, notes: '交互演示响应；重新查询时恢复固定数据基线。', verifyParams: path.includes(':id') ? { id: path.startsWith('/roles') ? 'R_ADMIN' : 'demo-id' } : {}, body: `  respond(null, '0000', '操作成功');` });
}
await emit({ method: 'POST', path: '/forums', name: '新增板块', file: 'forums/create.js', auth: true, notes: '返回固定演示 ID 与图片地址；重新查询恢复基线。', body: `  respond({ id: 'forum-demo-created', url: 'https://api.dicebear.com/9.x/icons/svg?seed=forum-demo-created' }, '0000', '操作成功');` });
await emit({ method: 'POST', path: '/uploadimage', name: '上传富文本图片', file: 'uploads/image.js', auth: true, notes: '返回固定演示图片 URL。', body: `  respond({ url: 'https://picsum.photos/seed/apifox-fixed-image/1200/675', alt: '固定演示图片', href: '' });` });
await emit({ method: 'POST', path: '/uploadvideo', name: '上传富文本视频', file: 'uploads/video.js', auth: true, notes: '返回固定演示视频与封面 URL。', body: `  respond({ url: 'https://media.w3.org/2010/05/sintel/trailer.mp4', poster: 'https://picsum.photos/seed/apifox-fixed-video/1200/675' });` });
await emit({ method: 'POST', path: '/profile/avatar', name: '上传头像', file: 'uploads/avatar.js', auth: true, notes: '返回固定 DiceBear 头像 URL。', body: `  respond({ url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ProfileUploadDemo' });` });

entries.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
await writeFile(join(root, 'manifest.json'), `${pretty({ version: 1, generatedAt: '2026-08-18', entries })}\n`, 'utf8');
console.log(`已生成 ${entries.length} 个 Apifox Mock 脚本。`);
