<script setup lang="ts">
/**
 * 评论管理组件：负责显示评论列表、筛选、批量操作与编辑功能。
 * 本次优化：
 * - 将状态筛选集中到折叠搜索栏中，避免头部重复展示。
 * - 将作者列前置到表格首位，方便快速识别作者信息。
 * - 为关键变量与函数增加详细注释，提升可维护性。
 */
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import {
  auditComments,
  batchDeleteComments,
  deleteComment,
  editComment,
  fetchCommentList
} from '@/service/api/comment';
import CustomPagination from '@/components/custom/pagination.vue';
import RichTextEditor from '@/components/common/richTextEditor.vue';
import DetailDialog from '../components/detailDialog.vue';

defineOptions({ name: 'CommentManager' });

type CommentInfo = Api.Comment.CommentInfo;
type CommentStatus = Api.Comment.CommentStatus;

/**
 * 状态映射：用于渲染筛选下拉与状态 Tag 的样式。
 * type 对应 Element Plus Tag 的类型，便于视觉区分。
 */
const statusOptions: { label: string; value: CommentStatus; type: 'success' | 'warning' | 'danger' | 'info' }[] = [
  { label: '待审核', value: 'pending', type: 'warning' },
  { label: '已发布', value: 'published', type: 'success' },
  { label: '已驳回', value: 'rejected', type: 'danger' },
  { label: '已删除', value: 'deleted', type: 'info' }
];

/** 搜索表单（响应式） */
const searchForm = reactive({
  authorName: '',
  status: '' as '' | CommentStatus,
  dateRange: [] as string[]
});

/** 分页与列表状态 */
const current = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
// 折叠面板当前激活项，默认展开 '1'；如需默认收起可设为 ''
const activeName = ref('1');
const comments = ref<CommentInfo[]>([]);
const selectedRows = ref<CommentInfo[]>([]);
const tableRef = ref();
const editFormRef = ref<FormInstance | null>(null);

/** 编辑弹窗相关 */
const editVisible = ref(false);
const editLoading = ref(false);
interface EditForm {
  id: string;
  content: string;
}
const editForm = reactive<EditForm>({ id: '', content: '' });
/** 详情弹窗相关 */
const detailVisible = ref(false);
const detailPostId = ref<string>('');
// 是否为回复（含 parentId 则认为是回复），用于决定编辑器类型：回复 -> 文本域；非回复 -> 富文本
const isReply = ref(false);

/** 编辑表单校验 */
const editRules: FormRules<EditForm> = {
  content: [{ required: true, message: '请输入评论内容', trigger: 'blur' }]
};

/** 选中数量（计算属性） */
const selectedCount = computed(() => selectedRows.value.length);

/** 返回状态文案 */
function statusLabel(status: CommentStatus) {
  return statusOptions.find(item => item.value === status)?.label || status;
}

/** 返回状态 Tag 类型 */
function statusTagType(status: CommentStatus) {
  return statusOptions.find(item => item.value === status)?.type || 'info';
}

/** 处理表格选择变化 */
function handleSelectionChange(selection: CommentInfo[]) {
  selectedRows.value = selection;
}

/** 清空表格选择（分页/重载时使用） */
function clearAllSelection() {
  tableRef.value?.clearSelection();
}

/**
 * 获取评论列表
 * - 根据 searchForm 与分页参数构造请求
 * - 成功后更新 comments、total 与 pageSize
 */
async function getCommentList() {
  loading.value = true;
  try {
    const [startTime, endTime] = searchForm.dateRange;
    const res = await fetchCommentList({
      pageNum: current.value,
      pageSize: pageSize.value,
      authorName: searchForm.authorName || undefined,
      status: searchForm.status || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined
    });
    // 如果后端返回了 children 字段，会触发表格的树形/展开行为，移除该字段以避免显示下拉图标
    const rawList = res.data?.list || [];
    // 深拷贝一份数据并递归移除所有 children 字段，避免修改原始响应
    const cloned = JSON.parse(JSON.stringify(rawList));
    const removeChildrenRecursive = (obj: any) => {
      if (!obj) return;
      if (Array.isArray(obj)) {
        obj.forEach(removeChildrenRecursive);
      } else if (typeof obj === 'object') {
        if ('children' in obj) delete obj.children;
        Object.values(obj).forEach(v => removeChildrenRecursive(v));
      }
    };
    removeChildrenRecursive(cloned);
    comments.value = cloned;
    total.value = res.data?.total || 0;
    pageSize.value = res.data?.pageSize || 10;
  } catch {
    ElMessage.error('获取评论列表失败');
  } finally {
    loading.value = false;
    clearAllSelection();
  }
}

/** 查询触发：如果不在第一页则先回到第一页以触发 watch */
function handleSearch() {
  if (current.value === 1) {
    getCommentList();
  } else {
    current.value = 1;
  }
}

/** 重置筛选并触发查询 */
function resetSearch() {
  searchForm.authorName = '';
  searchForm.status = '';
  searchForm.dateRange = [];
  handleSearch();
}

/** 校验是否已选中行（用于批量操作） */
function ensureSelected() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择至少一条评论');
    return false;
  }
  return true;
}

/** 单条审核 */
async function handleAudit(row: CommentInfo, status: Api.Comment.AuditBody['status']) {
  try {
    await auditComments({ ids: [row.id], status });
    ElMessage.success(status === 'published' ? '评论已通过' : '评论已驳回');
    await getCommentList();
  } catch {
    ElMessage.error('审核评论失败');
  }
}

/** 批量审核 */
async function handleBatchAudit(status: Api.Comment.AuditBody['status']) {
  if (!ensureSelected()) return;

  try {
    const ids = selectedRows.value.map(item => item.id);
    await auditComments({ ids, status });
    ElMessage.success(status === 'published' ? '批量审核通过' : '批量驳回成功');
    await getCommentList();
  } catch {
    ElMessage.error('批量审核失败');
  }
}

/** 单条删除 */
async function handleDelete(row: CommentInfo) {
  try {
    await ElMessageBox.confirm('确定要删除该评论吗？', '提示', { type: 'warning' });
    await deleteComment(row.id);
    ElMessage.success('删除成功');
    await getCommentList();
  } catch {
    ElMessage.error('删除评论失败');
  }
}

/** 批量删除 */
async function handleBatchDelete() {
  if (!ensureSelected()) return;

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条评论吗？`, '提示', { type: 'warning' });
    await batchDeleteComments(selectedRows.value.map(item => item.id));
    ElMessage.success('批量删除成功');
    await getCommentList();
  } catch {
    ElMessage.error('批量删除失败');
  }
}

/** 打开编辑弹窗 */
function openEdit(row: CommentInfo) {
  editForm.id = row.id;
  editForm.content = row.content;
  // 根据 parentId 判断是否为对评论的回复
  isReply.value = Boolean(row.parentId);
  editVisible.value = true;
  nextTick(() => {
    editFormRef.value?.clearValidate();
  });
}

/** 提交编辑 */
async function submitEdit() {
  await editFormRef.value?.validate();
  editLoading.value = true;
  try {
    await editComment(editForm.id, editForm.content.trim());
    ElMessage.success('评论已更新');
    editVisible.value = false;
    await getCommentList();
  } catch {
    ElMessage.error('保存评论失败');
  } finally {
    editLoading.value = false;
  }
}
/** 打开详情弹窗 */
function detailOpen(row: CommentInfo) {
  detailPostId.value = row.postId;
  detailVisible.value = true;
}

/** 监听页码变化，重新请求 */
watch(current, () => {
  getCommentList();
});

onMounted(() => {
  getCommentList();
});

defineExpose({
  reload: getCommentList
});
</script>

<template>
  <div class="comment-manager">
    <ElCard class="collapse-search">
      <ElCollapse v-model="activeName" accordion>
        <ElCollapseItem title="搜索选项" name="1" class="search-item">
          <div class="search-bar">
            <ElInput v-model="searchForm.authorName" placeholder="按作者搜索" clearable class="search-input" />
            <ElSelect v-model="searchForm.status" placeholder="状态" clearable class="status-select">
              <ElOption label="全部" value="" />
              <ElOption v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </ElSelect>
            <ElDatePicker
              v-model="searchForm.dateRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
            <ElButton type="primary" :loading="loading" @click="handleSearch">查询</ElButton>
            <ElButton @click="resetSearch">重置</ElButton>
          </div>
        </ElCollapseItem>
      </ElCollapse>
    </ElCard>

    <ElCard class="content-panel">
      <div class="card-header">
        <div class="title-wrap">
          <!-- <ElText class="title" size="large">{{ title }}</ElText> -->
          <!-- <ElTag v-if="compact" type="info" effect="plain">{{ total }}</ElTag> -->
        </div>
        <div class="actions-space">
          <!-- 状态筛选已移入折叠搜索栏，头部只保留常用操作 -->
          <ElButton type="primary" :loading="loading" @click="getCommentList">刷新</ElButton>
          <ElButton type="success" :disabled="!selectedCount" @click="() => handleBatchAudit('published')">
            批量通过
          </ElButton>
          <ElButton type="warning" :disabled="!selectedCount" @click="() => handleBatchAudit('rejected')">
            批量驳回
          </ElButton>
          <ElButton type="danger" :disabled="!selectedCount" @click="handleBatchDelete">批量删除</ElButton>
        </div>
      </div>

      <ElTable
        ref="tableRef"
        v-loading="loading"
        :data="comments"
        :row-key="row => row.id"
        element-loading-background="rgba(200, 200, 200, 0.8)"
        class="comment-table"
        @selection-change="handleSelectionChange"
      >
        <ElTableColumn type="selection" fixed :reserve-selection="true" width="50" />

        <!-- 作者列：头像 + 名称-->
        <ElTableColumn label="作者" width="120">
          <template #default="{ row }">
            <div class="author-cell">
              <ElAvatar :size="30" :src="row.authorAvatar || undefined">
                {{ row.authorName?.slice(0, 1) || '评' }}
              </ElAvatar>
              <div class="author-name">{{ row.authorName }}</div>
            </div>
          </template>
        </ElTableColumn>

        <!-- 评论内容列 -->
        <ElTableColumn label="评论内容" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="comment-content-cell">{{ row.content }}</div>
            <div v-if="row.parentId" class="reply-line">回复 {{ row.replyToName || row.parentId }}</div>
          </template>
        </ElTableColumn>

        <!-- 所属帖子 -->
        <ElTableColumn label="所属帖子" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <a class="post-title-link" @click="() => detailOpen(row)">{{ row.postTitle }}</a>
          </template>
        </ElTableColumn>

        <!-- 状态 -->
        <ElTableColumn label="状态" width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="statusTagType(row.status)" :class="{ 'deleted-tag': row.status === 'deleted' }">
              {{ statusLabel(row.status) }}
            </ElTag>
          </template>
        </ElTableColumn>

        <!-- 互动 -->
        <ElTableColumn label="互动" width="90" align="center">
          <template #default="{ row }">点赞 {{ row.likeCount }}</template>
        </ElTableColumn>

        <!-- 创建时间 -->
        <ElTableColumn prop="createTime" label="创建时间" width="170" />

        <!-- 操作列 -->
        <ElTableColumn label="操作" width="220" align="center">
          <template #default="{ row }">
            <div class="table-actions">
              <ElButton
                v-if="row.status !== 'published' && row.status !== 'deleted'"
                type="success"
                plain
                size="small"
                @click="() => handleAudit(row, 'published')"
              >
                通过
              </ElButton>
              <ElButton
                v-if="row.status !== 'rejected' && row.status !== 'deleted'"
                type="warning"
                plain
                size="small"
                @click="() => handleAudit(row, 'rejected')"
              >
                驳回
              </ElButton>
              <ElButton type="primary" plain size="small" @click="() => openEdit(row)">编辑</ElButton>
              <ElButton type="danger" plain size="small" @click="() => handleDelete(row)">删除</ElButton>
            </div>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="pagination-wrap">
        <CustomPagination v-model:current="current" v-model:page-size="pageSize" :total="total" />
      </div>
    </ElCard>

    <ElDialog v-model="editVisible" title="编辑评论" width="500px">
      <ElForm ref="editFormRef" :model="editForm" :rules="editRules" label-position="top">
        <ElFormItem label="评论内容" prop="content">
          <!-- 如果是回复（parentId 存在），使用纯文本域；否则使用富文本编辑器（仅图片+表情） -->
          <div v-if="isReply" style="width: 480px">
            <ElInput v-model="editForm.content" type="textarea" :rows="6" maxlength="1000" show-word-limit />
          </div>
          <div v-else style="width: 480px">
            <RichTextEditor v-model="editForm.content" :toolbar-keys="['emotion', 'uploadImage']" />
          </div>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="editVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="editLoading" @click="submitEdit">保存</ElButton>
      </template>
    </ElDialog>

    <DetailDialog v-model:model-value="detailVisible" :post-id="detailPostId" mode="view" />
  </div>
</template>

<style scoped lang="scss">
.comment-manager {
  .collapse-search {
    margin-bottom: 10px;
    border-radius: 8px;
    .search-item {
      box-sizing: border-box;
      /* padding: 10px; */
      border-radius: 8px;
    }
  }

  .search-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;

    .search-input {
      width: 220px;
    }

    .status-select {
      width: 140px;
    }
  }

  .content-panel {
    /* padding: 16px; */
    /* background: #fff; */
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;

    .title-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 120px;
    }

    .title {
      font-weight: 600;
    }

    .actions-space {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 8px;

      :deep(.el-button) {
        margin-left: 0;
      }
    }
  }

  .compact-status {
    width: 120px;
  }

  .comment-table {
    width: 100%;
  }

  .comment-content-cell {
    display: -webkit-box;
    overflow: hidden;
    color: var(--el-text-color-primary);
    line-height: 1.5;
    word-break: break-word;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .post-title-link {
    color: var(--el-text-color-primary);
    cursor: pointer;
    text-decoration: none;
  }

  .reply-line {
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .author-cell {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    min-width: 0;
  }

  .author-name {
    width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
  }

  .table-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 6px;

    :deep(.el-button) {
      margin-left: 0;
    }
  }

  .deleted-tag {
    border: 1px dashed #f56c6c !important;
    color: #f56c6c !important;
    background: transparent !important;
  }

  .pagination-wrap {
    display: flex;
    justify-content: flex-end;
    padding-top: 12px;
  }

  &.is-compact {
    .content-panel {
      padding: 0;
      border: 0;
      border-radius: 0;
    }

    .card-header {
      align-items: flex-start;
    }
  }
}
</style>
