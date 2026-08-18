import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
const manifest = await readJson('manifest.json');
const accounts = await readJson('data/accounts.json');
const users = await readJson('data/users.json');
const roles = await readJson('data/roles.json');
const forums = await readJson('data/forums.json');
const posts = await readJson('data/posts.json');
const comments = await readJson('data/comments.json');
const reports = await readJson('data/reports.json');
const notices = await readJson('data/notices.json');
const configs = await readJson('data/configs.json');
const profiles = await readJson('data/profiles.json');
const dashboard = await readJson('data/dashboard.json');

const scripts = new Map();
for (const entry of manifest.entries) {
  const source = await readFile(join(root, entry.script), 'utf8');
  scripts.set(entry.script, new vm.Script(source, { filename: entry.script }));
}

function findEntry(method, path) {
  const entry = manifest.entries.find(item => item.method === method && item.path === path);
  assert.ok(entry, `manifest 缺少 ${method} ${path}`);
  return entry;
}

function execute(entry, { params = {}, token } = {}) {
  let body;
  const authorization = token === null ? '' : `Bearer ${token || accounts[0].token}`;
  const headers = new Map([['authorization', authorization], ['Authorization', authorization]]);
  const fox = {
    mockRequest: {
      getParam(name) {
        return params[name];
      },
      headers: {
        get(name) {
          return headers.get(name) || '';
        }
      }
    },
    mockResponse: {
      setBody(value) {
        body = value;
      }
    }
  };
  scripts.get(entry.script).runInNewContext({ fox });
  assert.ok(body && Object.hasOwn(body, 'code') && Object.hasOwn(body, 'msg') && Object.hasOwn(body, 'data'), `${entry.script} 响应包装错误`);
  return JSON.parse(JSON.stringify(body));
}

assert.equal(manifest.version, 1);
assert.ok(manifest.entries.length >= 60, '接口脚本覆盖数量不足');

for (const entry of manifest.entries) {
  const result = execute(entry, { params: entry.verifyParams, token: entry.auth ? accounts[0].token : null });
  assert.equal(typeof result.code, 'string', `${entry.script} code 应为字符串`);
  assert.equal(typeof result.msg, 'string', `${entry.script} msg 应为字符串`);
}

assert.equal(accounts.length, 4);
assert.equal(users.length, 12);
assert.equal(roles.length, 3);
assert.equal(forums.length, 6);
assert.equal(posts.length, 12);
const flatComments = comments.flatMap(item => [item, ...(item.children || [])]);
assert.equal(flatComments.length, 18);
assert.equal(reports.length, 5);
assert.equal(reports.filter(item => item.status === 'pending').length, 2);
assert.equal(notices.length, 6);
assert.equal(notices.filter(item => item.status === 'published').length, 4);
assert.equal(notices.filter(item => item.status === 'draft').length, 1);
assert.equal(notices.filter(item => item.status === 'archived').length, 1);
assert.deepEqual(configs.map(item => item.groupKey), ['basic', 'seo', 'feature', 'third_party']);

const userMap = new Map(users.map(item => [item.id, item]));
const forumMap = new Map(forums.map(item => [item.id, item]));
const postMap = new Map(posts.map(item => [item.id, item]));
const commentMap = new Map(flatComments.map(item => [item.id, item]));
for (const account of accounts) {
  const user = userMap.get(account.userId);
  assert.ok(user, `登录账号 ${account.userName} 缺少用户记录`);
  assert.equal(user.username, account.userName);
  assert.equal(user.nickname, account.nickname);
  assert.deepEqual(user.roles, [account.userRole]);
}
for (const post of posts) {
  const author = userMap.get(post.authorId);
  const forum = forumMap.get(post.forumId);
  assert.ok(author, `帖子 ${post.id} 作者不存在`);
  assert.equal(post.authorName, author.nickname, `帖子 ${post.id} 作者昵称不一致`);
  assert.ok(forum, `帖子 ${post.id} 板块不存在`);
  assert.equal(post.forumName, forum.name, `帖子 ${post.id} 板块名称不一致`);
  if (post.status === 'published') assert.equal(forum.status, 1, `已发布帖子 ${post.id} 位于禁用板块`);
  assert.equal(post.commentCount, flatComments.filter(item => item.postId === post.id).length, `帖子 ${post.id} 评论数不一致`);
}
for (const comment of flatComments) {
  const author = userMap.get(comment.authorId);
  assert.ok(author, `评论 ${comment.id} 作者不存在`);
  assert.equal(comment.authorName, author.nickname, `评论 ${comment.id} 作者昵称不一致`);
  assert.ok(postMap.has(comment.postId), `评论 ${comment.id} 帖子不存在`);
  if (comment.parentId) assert.ok(commentMap.has(comment.parentId), `评论 ${comment.id} 父评论不存在`);
}
for (const report of reports) {
  const target = report.targetType === 'post' ? postMap.get(report.targetId) : commentMap.get(report.targetId);
  assert.ok(target, `举报 ${report.targetId} 目标不存在`);
  assert.equal(report.targetTitle, report.targetType === 'post' ? target.title : target.content);
  for (const detail of report.children) {
    const reporter = userMap.get(detail.reporterId);
    assert.ok(reporter, `举报 ${detail.id} 举报人不存在`);
    assert.equal(detail.reporterName, reporter.nickname, `举报 ${detail.id} 举报人昵称不一致`);
  }
}
for (const forum of forums) {
  if (forum.parentId) assert.ok(forumMap.has(forum.parentId), `板块 ${forum.id} 父板块不存在`);
  assert.equal(forum.postCount, posts.filter(item => item.forumId === forum.id).length, `板块 ${forum.id} postCount 不一致`);
}
assert.equal(forums.filter(item => item.parentId === null).length, 2);
for (const notice of notices) {
  const creator = userMap.get(notice.creatorId);
  assert.ok(creator, `公告 ${notice.id} 创建者不存在`);
  assert.equal(notice.creatorName, creator.nickname, `公告 ${notice.id} 创建者昵称不一致`);
}
assert.equal(dashboard.core.totalUsers, users.length);
assert.equal(dashboard.core.totalPosts, posts.length);
assert.equal(dashboard.core.totalComments, flatComments.length);
assert.equal(dashboard.core.pendingReports, reports.filter(item => item.status === 'pending').length);
assert.equal(dashboard.gender.male + dashboard.gender.female + dashboard.gender.unknown, users.length);
assert.equal(Object.values(dashboard.age).reduce((sum, value) => sum + value, 0), users.length);
assert.equal(Object.values(dashboard.device).reduce((sum, value) => sum + value, 0), users.length);
assert.equal(dashboard.hourlyPosts.count.reduce((sum, value) => sum + value, 0), posts.length);
for (const forum of dashboard.hotForums) assert.ok(forumMap.has(forum.forumId), `看板热门板块 ${forum.forumId} 不存在`);
for (const hotForum of dashboard.hotForums) {
  const forum = forumMap.get(hotForum.forumId);
  assert.equal(hotForum.forumName, forum.name);
  assert.equal(hotForum.postCount, forum.postCount);
}
for (const hotPost of dashboard.hotPosts) {
  const post = postMap.get(hotPost.id);
  assert.ok(post, `看板热门帖子 ${hotPost.id} 不存在`);
  assert.equal(hotPost.title, post.title);
  assert.equal(hotPost.authorName, post.authorName);
}
for (const record of profiles) {
  const user = userMap.get(record.userId);
  assert.ok(user, `profile ${record.userId} 用户不存在`);
  assert.equal(record.profile.nickname, user.nickname);
  assert.equal(record.profile.username, user.username);
  assert.equal(record.stats.likes, posts.filter(item => item.authorId === record.userId).reduce((sum, item) => sum + item.likeCount, 0));
  assert.equal(record.stats.comments, flatComments.filter(item => item.authorId === record.userId).length);
  for (const item of record.timeline) {
    assert.ok(item.type === 'post' ? postMap.has(item.targetId) : item.type === 'comment' ? commentMap.has(item.targetId) : true);
  }
  for (const item of [...record.history, ...record.favorites]) {
    assert.ok(item.targetType === 'post' ? postMap.has(item.targetId) : commentMap.has(item.targetId));
  }
}

const datedRecords = [...users, ...forums, ...posts, ...flatComments, ...notices];
assert.ok(datedRecords.every(item => item.createTime.slice(0, 10) >= '2026-05-20' && item.createTime.slice(0, 10) <= '2026-08-18'));

const loginEntry = findEntry('POST', '/auth/login');
const userInfoEntry = findEntry('GET', '/auth/getUserInfo');
const refreshEntry = findEntry('POST', '/auth/refreshToken');
for (const account of accounts) {
  const login = execute(loginEntry, { params: { userName: account.userName, password: account.password }, token: null });
  assert.equal(login.code, '0000');
  assert.equal(login.data.token, account.token);
  const info = execute(userInfoEntry, { token: account.token });
  assert.equal(info.data.userId, account.userId);
  assert.deepEqual(info.data.roles, [account.userRole]);
  assert.equal(info.data.buttons.length, account.userRole === 'R_SUPER' ? 31 : account.userRole === 'R_ADMIN' ? 25 : 0);
  const refresh = execute(refreshEntry, { params: { refreshToken: account.refreshToken }, token: null });
  assert.equal(refresh.data.token, account.token);
}
assert.equal(execute(userInfoEntry, { token: 'UNKNOWN_TOKEN' }).code, '8888');
assert.equal(execute(userInfoEntry, { token: null }).code, '8888');

const usersEntry = findEntry('GET', '/users');
const stableSamples = Array.from({ length: 10 }, () => execute(usersEntry, { params: { pageNum: 1, pageSize: 5 } }));
for (const sample of stableSamples.slice(1)) assert.deepEqual(sample, stableSamples[0]);
assert.equal(stableSamples[0].data.list.length, 5);
assert.equal(stableSamples[0].data.total, 12);
const disabledUsers = execute(usersEntry, { params: { pageNum: 1, pageSize: 10, status: 0 } });
assert.equal(disabledUsers.data.total, 1, '数值状态 0 筛选失败');
assert.equal(disabledUsers.data.list[0].id, '9');

const postsEntry = findEntry('GET', '/posts');
const publishedPosts = execute(postsEntry, { params: { pageNum: 1, pageSize: 20, status: 'published' } });
assert.ok(publishedPosts.data.list.every(item => item.status === 'published'));
assert.equal(publishedPosts.data.total, posts.filter(item => item.status === 'published').length);
const postDetail = execute(findEntry('GET', '/posts/:id'), { params: { id: 'p001' } });
assert.deepEqual(postDetail.data, posts[0]);

const noticesEntry = findEntry('GET', '/notices');
const publishedNotices = execute(noticesEntry, { params: { pageNum: 1, pageSize: 20, status: 'published' } });
assert.equal(publishedNotices.data.total, 4);
assert.ok(publishedNotices.data.list.every(item => item.status === 'published'));

for (const account of accounts) {
  const result = execute(findEntry('GET', '/profile'), { token: account.token });
  assert.equal(result.data.id, account.userId);
  assert.equal(result.data.nickname, account.nickname);
}

console.log(`验证通过：${manifest.entries.length} 个脚本、4 个身份、12 名用户、12 条帖子、18 条评论及全部固定关联数据。`);
