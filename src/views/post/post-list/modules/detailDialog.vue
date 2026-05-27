<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { auditPosts, deletePost, editPost, fetchPostDetail, setPostEssence, setPostTop } from '@/service/api/post';
import SafeContent from '@/components/common/safeContend.vue';

const props = defineProps<{
  modelValue: boolean;
  postId?: string;
  mode?: 'view' | 'edit';
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
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

async function loadDetail() {
  if (!props.postId) return;
  loading.value = true;
  try {
    const res = await fetchPostDetail(props.postId as string);
    post.value = res.data;
    avatarUrl.value = post.value?.authorAvatar || undefined;
    contentEdit.value = post.value?.content || '';
  } catch {
    ElMessage.error('获取详情失败');
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.postId,
  v => {
    if (v && visible.value) loadDetail();
  }
);
watch(
  () => props.modelValue,
  v => {
    if (v && props.postId) loadDetail();
    if (!v) post.value = null;
  }
);

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
  } catch {
    ElMessage.error('操作失败');
  }
}

async function doDelete() {
  if (!post.value) return;
  try {
    await ElMessageBox.confirm('确认删除该帖子？', '提示', { type: 'warning' });
    await deletePost(post.value.id);
    ElMessage.success('删除成功');
    close();
  } catch {
    // cancel or fail
  }
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
  } catch {
    ElMessage.error('保存失败');
  }
}

// 示例评论
const comments = ref([
  {
    id: 'c1',
    authorName: '评论者A',
    authorAvatar: '',
    content: '这是第一条示例评论的内容。',
    createTime: '2026-05-22 10:00',
    likeCount: 3,
    commentCount: 1,
    collapsed: false
  },
  {
    id: 'c2',
    authorName: '评论者B',
    authorAvatar: '',
    content: '第二条评论，演示折叠与删除。',
    createTime: '2026-05-22 11:12',
    likeCount: 1,
    commentCount: 0,
    collapsed: false
  }
]);

function toggleCommentCollapse(c: any) {
  c.collapsed = !c.collapsed;
}

async function deleteComment(c: any) {
  try {
    await ElMessageBox.confirm('确认删除该评论？', '提示', { type: 'warning' });
    const idx = comments.value.findIndex(i => i.id === c.id);
    if (idx >= 0) comments.value.splice(idx, 1);
    ElMessage.success('评论已删除');
  } catch {
    // canceled
  }
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
  <ElDialog v-model="visible" width="1000px" top="6vh" :destroy-on-close="true">
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
            <span v-if="post?.updateTime" style="margin-left: 8px">最后编辑: {{ post?.updateTime }}</span>
          </div>
        </div>

        <div class="post-body">
          <!-- 主体内容：查看时使用 SafeContent，编辑时使用富文本 -->
          <SafeContent v-if="post && !isEditMode" :html="post.content || ''" :allow-iframe="true" />
          <RichTextEditor v-else-if="post && isEditMode" v-model:model-value="contentEdit" />
        </div>

        <!-- 评论区 -->
        <div class="comments">
          <div class="comments-title">评论（{{ comments.length }}）</div>
          <div class="comment-list">
            <div v-for="c in comments" :key="c.id" class="comment-item">
              <div class="comment-head">
                <ElAvatar :size="36">
                  <img
                    v-if="c.authorAvatar"
                    :src="c.authorAvatar"
                    style="width: 100%; height: 100%; object-fit: cover"
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
                <div class="comment-meta">{{ c.createTime }} · 点赞 {{ c.likeCount }} · 评论 {{ c.commentCount }}</div>
                <div class="comment-actions">
                  <ElButton link size="small" @click="() => toggleCommentCollapse(c)">
                    {{ c.collapsed ? '展开' : '折叠' }}
                  </ElButton>
                  <ElButton link size="small" @click="() => deleteComment(c)">删除</ElButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧互动及操作 -->
      <div class="col right">
        <div class="stats-box">
          <div class="stat">
            查看
            <br />
            <strong>{{ post?.viewCount ?? 0 }}</strong>
          </div>
          <div class="stat">
            点赞
            <br />
            <strong>{{ post?.likeCount ?? 0 }}</strong>
          </div>
          <div class="stat">
            评论
            <br />
            <strong>{{ post?.commentCount ?? 0 }}</strong>
          </div>
        </div>

        <div class="ops-box">
          <ElButton v-if="post?.status === 'pending'" type="success" style="width: 100%" @click="() => doAudit(true)">
            通过
          </ElButton>
          <ElButton
            v-if="post?.status === 'pending'"
            type="warning"
            style="width: 100%; margin-top: 8px"
            @click="() => doAudit(false)"
          >
            驳回
          </ElButton>
          <ElButton type="danger" style="width: 100%; margin-top: 8px" @click="doDelete">删除</ElButton>
          <ElButton type="info" style="width: 100%; margin-top: 8px" @click="toggleTop">
            {{ post?.top === 1 ? '取消置顶' : '置顶' }}
          </ElButton>
          <ElButton type="info" style="width: 100%; margin-top: 8px" @click="toggleEssence">
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
      }
      .comment-footer {
        margin-top: 8px;
        display: flex;
        justify-content: space-between;
        color: #888;
        font-size: 13px;
      }
    }
  }
}
.col.right {
  .stats-box {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    padding: 12px;
    border: 1px solid #f0f0f0;
    border-radius: 6px;
    .stat {
      text-align: center;
      color: #666;
      strong {
        font-size: 18px;
        display: block;
        margin-top: 6px;
      }
    }
  }
  .ops-box {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    .el-button {
      margin: 4px 0px;
    }
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
</style>
