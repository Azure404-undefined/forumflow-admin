<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { auditPosts, deletePost, editPost, fetchPostDetail, setPostEssence, setPostTop } from '@/service/api/post';
import { deleteComment, fetchCommentList } from '@/service/api/comment';
import SafeContent from '@/components/common/safeContend.vue';

const props = defineProps<{
  modelValue: boolean;
  postId?: string;
  mode?: 'view' | 'edit';
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'updated'): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
});

const isEditMode = computed(() => props.mode === 'edit');

const loading = ref(false);
const post = ref<Api.Post.PostInfo | null>(null);
const avatarUrl = ref<string | undefined>(undefined);
const contentEdit = ref('');
const comments = ref<Api.Comment.CommentInfo[] | undefined>();

async function loadDetail() {
  if (!props.postId) return;
  loading.value = true;
  try {
    await fetchPostDetail(props.postId).then(res => {
      post.value = res.data;
      avatarUrl.value = post.value?.authorAvatar || undefined;
      contentEdit.value = post.value?.content || '';
      // console.log('帖子详情', post.value);
    });
    await fetchCommentList({ pageNum: 1, pageSize: 10, postId: props.postId }).then(res => {
      comments.value = res.data?.list;
      // console.log('评论列表', comments.value);
    });
  } catch {
    ElMessage.error('获取详情失败');
  } finally {
    loading.value = false;
  }
}

async function handleCommentChanged() {
  await loadDetail();
  emit('updated');
}

// 合并监听，避免在 postId 与 modelValue 同时变化时重复请求
watch([() => props.modelValue, () => props.postId], ([valVisible, valPostId], [oldVisible, oldPostId]) => {
  if (valVisible && valPostId) {
    // 仅在对话框刚打开或 postId 变更时加载，防止重复请求
    if (!oldVisible || oldPostId !== valPostId) {
      loadDetail();
    }
  }
  if (!valVisible) {
    post.value = null;
  }
});

function close() {
  visible.value = false;
}

function onAvatarError() {
  avatarUrl.value = undefined;
}

async function toggleTop() {
  if (!post.value) return;
  try {
    const newTop: Api.Post.TopStatus = post.value.top === 1 ? 0 : 1;
    await setPostTop(post.value.id, newTop);
    ElMessage.success(newTop === 1 ? '已置顶' : '已取消置顶');
    await loadDetail();
    emit('updated');
  } catch {
    ElMessage.error('操作失败');
  }
}

async function toggleEssence() {
  if (!post.value) return;
  try {
    const newEssence: Api.Post.EssenceStatus = post.value.essence === 1 ? 0 : 1;
    await setPostEssence(post.value.id, newEssence);
    ElMessage.success(newEssence === 1 ? '已加精' : '已取消加精');
    await loadDetail();
    emit('updated');
  } catch {
    ElMessage.error('操作失败');
  }
}

async function doAudit(pass: boolean) {
  if (!post.value) return;
  try {
    const status: Api.Post.PostStatus = pass ? 'published' : 'rejected';
    await auditPosts({ ids: [post.value.id], status });
    ElMessage.success(pass ? '审核通过' : '已驳回');
    await loadDetail();
    emit('updated');
  } catch {
    ElMessage.error('操作失败');
  }
}

async function doDelete() {
  if (!post.value) return;
  try {
    await ElMessageBox.confirm('确认删除该帖子？', '提示', { type: 'warning' });
    await deletePost(post.value.id);
    await loadDetail();
    ElMessage.success('删除成功');
    close();
    emit('updated');
  } catch {}
}

// 编辑并保存
async function savePost() {
  if (!post.value) return;
  try {
    const payload = {
      title: post.value.title,
      content: contentEdit.value,
      forumId: post.value.forumId,
      status: post.value.status,
      top: post.value.top,
      essence: post.value.essence
    };
    await editPost(post.value.id, payload);
    ElMessage.success('保存成功');
    close();
    emit('updated');
  } catch {
    ElMessage.error('保存失败');
  }
}

// 示例评论（支持二级评论）

function toggleCommentCollapse(c: any) {
  c.collapsed = !c.collapsed;
}

function toggleChildrenCollapse(c: any) {
  c.childrenCollapsed = !c.childrenCollapsed;
}

function visibleChildren(c: any) {
  if (!c.children || c.children.length === 0) return [];
  if (c.childrenCollapsed) return c.children.slice(0, 2);
  return c.children;
}

async function handleDeleteComment(c: any) {
  try {
    await ElMessageBox.confirm('确认删除该评论？', '提示', { type: 'warning' });
    await deleteComment(c.id);
    await handleCommentChanged();
    ElMessage.success('评论已删除');
  } catch {}
}

const statusLabel = (s: Api.Post.PostStatus | undefined) => {
  switch (s) {
    case 'draft':
      return '草稿';
    case 'published':
      return '已发布';
    case 'pending':
      return '待审核';
    case 'rejected':
      return '已驳回';
    case 'deleted':
      return '已删除';
    default:
      return '';
  }
};
</script>

<template>
  <ElDialog v-model="visible" width="min(1000px, 94vw)" top="6vh" :destroy-on-close="true">
    <template #header>
      <div class="dialog-title">帖子详情</div>
    </template>

    <div class="detail-inner">
      <!-- 左侧作者 -->
      <div class="col left">
        <div class="author-box">
          <ElAvatar :size="100" :src="post?.authorAvatar" @error="onAvatarError">
            <!-- <img v-if="avatarUrl" :src="avatarUrl" @error="onAvatarError" style="width:100%;height:100%;object-fit:cover" /> -->
          </ElAvatar>
          <div class="author-name">{{ post?.authorName || '—' }}</div>
          <div class="author-extra">作者ID: {{ post?.authorId || '—' }}</div>
        </div>
      </div>

      <!-- 中间内容 -->
      <div v-loading="loading" class="col center">
        <div class="post-header">
          <h3 class="post-title">{{ post?.title || '（无标题）' }}</h3>
          <div class="post-meta">
            <span class="forum">{{ post?.forumName || '未分类' }}</span>
            <ElTag
              class="status-tag"
              :type="
                post?.status === 'published'
                  ? 'success'
                  : post?.status === 'pending'
                    ? 'warning'
                    : post?.status === 'rejected'
                      ? 'danger'
                      : 'info'
              "
              :class="{ 'deleted-tag': post?.status === 'deleted' }"
            >
              {{ statusLabel(post?.status) }}
            </ElTag>
            <ElTag v-if="post?.top === 1" type="info">置顶</ElTag>
            <ElTag v-if="post?.essence === 1" type="success">加精</ElTag>
          </div>
          <div class="post-dates">
            <span v-if="post?.createTime">发布日期: {{ post?.createTime }}</span>
            <span v-if="post?.updateTime" class="date-gap">最后编辑: {{ post?.updateTime }}</span>
          </div>
        </div>

        <div class="post-body">
          <!-- 主体内容：查看时使用 SafeContent，编辑时使用富文本 -->
          <SafeContent v-if="post && !isEditMode" :html="post.content || ''" :allow-iframe="true" />
          <RichTextEditor v-else-if="post && isEditMode" v-model:model-value="contentEdit" />
        </div>

        <!-- 评论区 -->
        <div class="comments">
          <div class="comments-title">评论（{{ comments?.length ?? 0 }}）</div>
          <div class="comment-list">
            <div v-for="c in comments" :key="c.id" class="comment-item">
              <div class="comment-head">
                <ElAvatar :size="36">
                  <img
                    v-if="c.authorAvatar"
                    :src="c.authorAvatar"
                    class="avatar-img"
                    @error="() => (c.authorAvatar = '')"
                  />
                </ElAvatar>
                <div class="comment-author">{{ c.authorName }}</div>
              </div>
              <div class="comment-body">
                <div v-if="!c.collapsed" class="comment-content">{{ c.content }}</div>
                <div v-else class="comment-collapsed">已折叠</div>
              </div>
              <div class="comment-footer">
                <div class="comment-meta">
                  {{ c.createTime }} · 点赞 {{ c.likeCount }} · 评论 {{ c.children?.length ?? 0 }}
                </div>
                <div class="comment-actions" :class="{ display: mode === 'view' ? true : false }">
                  <ElButton link size="small" @click="() => toggleCommentCollapse(c)">
                    {{ c.collapsed ? '展开' : '折叠' }}
                  </ElButton>
                  <ElButton link size="small" @click="() => handleDeleteComment(c)">删除</ElButton>
                </div>
              </div>
              <!-- 二级评论列表（默认折叠，仅显示前两条） -->
              <div v-if="c.children && c.children.length" class="replies">
                <div v-for="r in visibleChildren(c)" :key="r.id" class="reply-item">
                  <div class="reply-head">
                    <ElAvatar :size="28">
                      <img
                        v-if="r.authorAvatar"
                        :src="r.authorAvatar"
                        class="avatar-img"
                        @error="() => (r.authorAvatar = '')"
                      />
                    </ElAvatar>
                    <div class="reply-author">
                      {{ r.authorName }}
                      <span v-if="r.replyToName" class="reply-to">回复</span>
                      {{ r.replyToName }}
                    </div>
                  </div>
                  <div class="reply-content">{{ r.content }}</div>
                  <div class="reply-footer">
                    <div class="reply-meta">{{ r.createTime }} · 点赞 {{ r.likeCount }}</div>
                    <div class="reply-actions" :class="{ display: mode === 'view' ? true : false }">
                      <ElButton link size="small" @click="() => handleDeleteComment(r)">删除</ElButton>
                    </div>
                  </div>
                </div>
                <div v-if="c.children.length > 2" class="reply-toggle">
                  <ElButton link size="small" @click="() => toggleChildrenCollapse(c)">
                    {{ c.childrenCollapsed ? '显示所有评论' : '收起评论' }}
                  </ElButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧互动及操作 -->
      <div class="col right">
        <div class="stats-box">
          <div class="stat-card views" title="查看">
            <SvgIcon icon="mdi:eye-outline" class="stat-icon" />
            <span class="stat-value">{{ post?.viewCount ?? 0 }}</span>
          </div>
          <div class="stat-card likes" title="点赞">
            <SvgIcon icon="mdi:thumb-up-outline" class="stat-icon" />
            <span class="stat-value">{{ post?.likeCount ?? 0 }}</span>
          </div>
          <div class="stat-card comments" title="评论">
            <SvgIcon icon="mdi:comment-outline" class="stat-icon" />
            <span class="stat-value">{{ post?.commentCount ?? 0 }}</span>
          </div>
        </div>

        <div class="ops-box" :class="{ 'box-display': mode === 'view' ? true : false }">
          <ElButton v-if="post?.status === 'pending'" type="success" @click="() => doAudit(true)">
            <SvgIcon icon="ic:round-check" class="mr-4px text-16px" />
            通过
          </ElButton>
          <ElButton v-if="post?.status === 'pending'" type="warning" @click="() => doAudit(false)">
            <SvgIcon icon="ic:round-close" class="mr-4px text-16px" />
            驳回
          </ElButton>
          <ElButton type="danger" @click="doDelete">
            <SvgIcon icon="ic:round-delete" class="mr-4px text-16px" />
            删除
          </ElButton>
          <ElButton type="info" @click="toggleTop">
            <SvgIcon icon="ic:round-vertical-align-top" class="mr-4px text-16px" />
            {{ post?.top === 1 ? '取消置顶' : '置顶' }}
          </ElButton>
          <ElButton type="info" @click="toggleEssence">
            <SvgIcon icon="ic:round-star" class="mr-4px text-16px" />
            {{ post?.essence === 1 ? '取消加精' : '加精' }}
          </ElButton>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer-actions">
        <ElButton v-if="isEditMode" type="primary" @click="savePost">保存</ElButton>
        <ElButton @click="close">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
.detail-inner {
  display: grid;
  grid-template-columns: 12vw 1fr 10vw;
  gap: 16px;
  height: calc(100vh - 220px);
}
.col.left {
  .author-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px;
  }
  .author-name {
    font-weight: 600;
  }
  .author-extra {
    color: #888;
    font-size: 12px;
  }
}
.col.center {
  overflow-y: auto;
  max-height: calc(100vh - 280px);
  .post-header {
    .post-title {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 700;
    }
    .post-meta {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 12px;
    }
    .date-gap {
      margin-left: 8px;
    }
  }
  .post-body {
    min-height: 220px;
    border: 1px dashed #e6e6e6;
    padding: 12px;
    background: #fff;
    .content-placeholder {
      color: #999;
    }
  }
  .comments {
    margin-top: 12px;
    .comments-title {
      font-weight: 600;
      margin-bottom: 8px;
    }
    .comment-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .comment-item {
      border: 1px solid #f0f0f0;
      padding: 10px;
      border-radius: 6px;
      .comment-head {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .comment-author {
        font-weight: 600;
      }
      .comment-body {
        margin-top: 8px;
        margin-left: 44px;
      }
      .comment-footer {
        margin-top: 8px;
        display: flex;
        justify-content: space-between;
        color: #888;
        font-size: 13px;
        .comment-actions.display {
          display: none;
        }
      }
      .replies {
        margin-top: 10px;
        padding-left: 44px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .reply-item {
        /* background: #fafafa; */
        border-radius: 6px;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .reply-head {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .reply-author {
        font-weight: 600;
        /* color: #333; */
      }
      .reply-to {
        color: #888;
        margin-left: 6px;
        font-weight: 400;
      }
      .reply-content {
        /* color: #333; */
        font-size: 14px;
      }

      .reply-footer {
        display: flex;
        justify-content: space-between;
      }

      .reply-meta {
        color: #999;
        font-size: 12px;
      }
      .reply-toggle {
        padding-left: 44px;
      }
      .reply-actions {
        margin: 1px 0;
      }
      .reply-actions.display {
        display: none;
      }
    }
  }
}
.col.right {
  .stats-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  :deep(.stat-icon) {
    flex: 0 0 auto;
    font-size: 18px;
  }
  .stat-card.views :deep(.stat-icon) {
    color: var(--el-color-primary-light-3);
  }
  .stat-card.likes :deep(.stat-icon) {
    color: var(--el-color-warning-light-3);
  }
  .stat-card.comments :deep(.stat-icon) {
    color: var(--el-color-success-light-3);
  }
  .stat-value {
    font-size: 15px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
  }
  .ops-box {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    .el-button {
      margin: 4px 0px;
      width: 100%;
    }
  }
  .ops-box.box-display {
    display: none;
  }
}

@media (max-width: 768px) {
  .detail-inner {
    grid-template-columns: 1fr;
    height: auto;
    gap: 12px;
  }
  .col.left {
    order: 1;
  }
  .col.right {
    order: 2;
  }
  .col.center {
    order: 3;
    max-height: none;
    overflow: visible;
  }
  .col.left .author-box {
    flex-direction: row;
    justify-content: flex-start;
    gap: 12px;
    padding: 8px 4px;
  }
  .col.left :deep(.el-avatar) {
    width: 56px !important;
    height: 56px !important;
    line-height: 56px !important;
  }

  .col.right .stats-box {
    flex-direction: row;
    width: 50%;
  }
  .col.right .stat-card {
    flex: 1;
  }

  .col.right .ops-box {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .col.right .ops-box .el-button {
    flex: 1 1 auto;
    width: auto;
    margin: 4px;
  }
}
.deleted-tag {
  border: 1px dashed #f56c6c !important;
  color: #f56c6c !important;
  background: transparent !important;
}
.dialog-footer-actions {
  text-align: right;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
