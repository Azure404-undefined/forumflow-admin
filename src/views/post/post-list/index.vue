<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance } from 'element-plus';
import {
  addPost,
  auditPosts,
  batchDeletePosts,
  deletePost,
  editPost,
  fetchPostList,
  setPostEssence,
  setPostTop
} from '@/service/api/post';
import CustomPagination from '@/components/custom/pagination.vue';
import DetailDialog from '../components/detailDialog.vue';

// 搜索与分页
const searchForm = reactive({
  title: '',
  authorName: '',
  forumId: '',
  status: '' as Api.Post.PostStatus,
  top: 0 as Api.Post.TopStatus,
  essence: 0 as Api.Post.EssenceStatus,
  dateRange: []
});
const current = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const activeName = ref('0');

// 表格与选中
const posts = ref<Api.Post.PostInfo[]>([]);
const selectedRows = ref<Api.Post.PostInfo[]>([]);
const tableRef = ref<any>();
const detailVisible = ref(false);
const detailPostId = ref('');
const detailMode = ref<'view' | 'edit'>('view');

function handleSelectionChange(selection: Api.Post.PostInfo[]) {
  selectedRows.value = selection;
}

function detailOpen(row: Api.Post.PostInfo) {
  detailMode.value = 'view';
  detailPostId.value = row.id;
  detailVisible.value = true;
}

function clearAllSelection() {
  nextTick(() => {
    tableRef.value?.clearSelection();
  });
}

// 分页 & 列表
async function getPostList() {
  posts.value = [];
  loading.value = true;
  try {
    const dataParams = {
      startTime: '',
      endTime: ''
    };
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      dataParams.startTime = searchForm.dateRange[0];
      dataParams.endTime = searchForm.dateRange[1];
    }
    const res = await fetchPostList({
      pageNum: current.value,
      pageSize: pageSize.value,
      title: searchForm.title,
      authorName: searchForm.authorName,
      forumId: searchForm.forumId,
      status: searchForm.status,
      top: searchForm.top,
      essence: searchForm.essence,
      ...dataParams
    });
    posts.value = res.data?.list || [];
    total.value = res.data?.total || 0;
    pageSize.value = res.data?.pageSize || pageSize.value;
  } catch {
    ElMessage.error('获取帖子列表失败');
  } finally {
    loading.value = false;
    clearAllSelection();
  }
}

watchDebounced(
  [current, () => searchForm],
  () => {
    getPostList();
  },
  { deep: true, debounce: 1000, maxWait: 2000 }
);

watch(pageSize, () => {
  current.value = 1;
});

function resetSearch() {
  searchForm.title = '';
  searchForm.authorName = '';
  searchForm.forumId = '';
  searchForm.status = '' as Api.Post.PostStatus;
  searchForm.top = 0;
  searchForm.essence = 0;
  searchForm.dateRange = [];
  current.value = 1;
}

// 新增/编辑抽屉
const isOpen = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance | null>(null);
const form = ref<Api.Post.PostForm>({
  title: '',
  content: '',
  forumId: '',
  status: 'draft',
  top: 0,
  essence: 0
});

function resetForm() {
  form.value = {
    title: '',
    content: '',
    forumId: '',
    status: 'draft',
    top: 0,
    essence: 0
  };
}

async function handleCreate() {
  resetForm();
  isEdit.value = false;
  isOpen.value = true;
}

function handleEdit(row: Api.Post.PostInfo) {
  // 使用详情弹窗的编辑模式
  detailMode.value = 'edit';
  detailPostId.value = row.id;
  detailVisible.value = true;
}

async function onSubmit() {
  try {
    if (isEdit.value && form.value.id) {
      await editPost(form.value.id, form.value);
      ElMessage.success('编辑成功');
    } else {
      await addPost(form.value);
      ElMessage.success('新增成功');
    }
    isOpen.value = false;
    current.value = 1;
    getPostList();
  } catch {
    ElMessage.error('保存失败');
  }
}

// 单项操作
async function handleDelete(row: Api.Post.PostInfo) {
  try {
    await ElMessageBox.confirm('确定要删除该帖子吗？', '提示', { type: 'warning' });
    await deletePost(row.id);
    ElMessage.success('删除成功');
    getPostList();
  } catch {
    // 取消或失败
    ElMessage.error('删除失败');
  }
}

async function handleToggleTop(row: Api.Post.PostInfo) {
  try {
    const newTop: Api.Post.TopStatus = row.top === 1 ? 0 : 1;
    await setPostTop(row.id, newTop);
    ElMessage.success(newTop === 1 ? '已置顶' : '已取消置顶');
    getPostList();
  } catch {
    ElMessage.error('操作失败');
  }
}

async function handleToggleEssence(row: Api.Post.PostInfo) {
  try {
    const newEssence: Api.Post.EssenceStatus = row.essence === 1 ? 0 : 1;
    await setPostEssence(row.id, newEssence);
    ElMessage.success(newEssence === 1 ? '已加精' : '已取消加精');
    getPostList();
  } catch {
    ElMessage.error('操作失败');
  }
}

async function handleAuditSingle(row: Api.Post.PostInfo, pass = true) {
  try {
    const status: Api.Post.PostStatus = pass ? 'published' : 'rejected';
    await auditPosts({ ids: [row.id], status });
    ElMessage.success(pass ? '审核通过' : '已驳回');
    getPostList();
  } catch {
    ElMessage.error('操作失败');
  }
}

// 批量操作
async function batchDelete() {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('请先选择至少一项');
    return;
  }
  try {
    await ElMessageBox.confirm('确定要删除选中帖子吗？', '提示', { type: 'warning' });
    const ids = selectedRows.value.map(i => i.id);
    await batchDeletePosts({ ids });
    ElMessage.success('批量删除成功');
    getPostList();
    clearAllSelection();
  } catch {
    ElMessage.error('批量删除失败');
  }
}

async function batchAudit() {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('请先选择至少一项');
    return;
  }
  const ids = selectedRows.value.map(i => i.id);
  try {
    await ElMessageBox.confirm('选择“通过”或“驳回”对选中帖子进行批量审核', '批量审核', {
      confirmButtonText: '通过',
      cancelButtonText: '驳回',
      distinguishCancelAndClose: true,
      type: 'warning'
    })
      .then(async () => {
        await auditPosts({ ids, status: 'published' });
        ElMessage.success('批量审核通过');
        getPostList();
        clearAllSelection();
      })
      .catch(async actions => {
        if (actions === 'cancel') {
          await auditPosts({ ids, status: 'rejected' });
          ElMessage.success('批量已驳回');
          getPostList();
          clearAllSelection();
        }
      });
  } catch {
    ElMessage.error('批量审核失败');
  }
}

const forums = ref([
  { id: '', name: '全部' },
  { id: '1', name: '讨论区' },
  { id: '2', name: '公告' },
  { id: '3', name: '发现' }
]);

onMounted(() => {
  getPostList();
});
</script>

<template>
  <div class="post-list-page">
    <ElCard class="collapse-search">
      <ElCollapse v-model="activeName" accordion>
        <ElCollapseItem title="搜索选项" name="1" class="search-item">
          <div class="search-bar">
            <ElInput v-model="searchForm.title" placeholder="按标题搜索" clearable class="search-input" />
            <ElInput v-model="searchForm.authorName" placeholder="按作者搜索" clearable class="search-input" />
            <ElSelect v-model="searchForm.forumId" placeholder="版块" class="status-select">
              <ElOption v-for="f in forums" :key="f.id" :label="f.name" :value="f.id" />
            </ElSelect>
            <ElSelect v-model="searchForm.status" placeholder="状态" class="status-select">
              <ElOption label="全部" value="" />
              <ElOption label="草稿" value="draft" />
              <ElOption label="已发布" value="published" />
              <ElOption label="待审核" value="pending" />
              <ElOption label="已驳回" value="rejected" />
              <ElOption label="已删除" value="deleted" />
            </ElSelect>
            <ElSelect v-model="searchForm.top" placeholder="置顶" class="status-select">
              <!-- <ElOption label="全部" value="" /> -->
              <ElOption label="置顶" :value="1" />
              <ElOption label="未置顶" :value="0" />
            </ElSelect>
            <ElSelect v-model="searchForm.essence" placeholder="加精" class="status-select">
              <!-- <ElOption label="全部" value="" /> -->
              <ElOption label="加精" :value="1" />
              <ElOption label="未加精" :value="0" />
            </ElSelect>
            <ElDatePicker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
            <ElButton @click="resetSearch">重置</ElButton>
          </div>
        </ElCollapseItem>
      </ElCollapse>
    </ElCard>

    <ElCard class="card-wrapper">
      <div class="card-header">
        <ElText class="mx-1" size="large">帖子列表</ElText>
        <div class="actions-space">
          <ElButton type="primary" :loading="loading" @click="getPostList">刷新</ElButton>
          <ElButton type="primary" @click="handleCreate">新增帖子</ElButton>
          <ElButton type="primary" @click="batchAudit">批量审核</ElButton>
          <ElButton type="danger" @click="batchDelete">批量删除</ElButton>
        </div>
      </div>
      <ElTable
        ref="tableRef"
        v-loading="loading"
        :data="posts"
        :row-key="row => row.id"
        height="520"
        element-loading-background="rgba(200, 200, 200, 0.8)"
        class="post-table"
        @selection-change="handleSelectionChange"
      >
        <ElTableColumn type="selection" fixed :reserve-selection="true" width="50"></ElTableColumn>
        <ElTableColumn label="标题" min-width="280" show-overflow-tooltip>
          <template #default="{ row }">
            <a class="post-title-link" @click="() => detailOpen(row)">{{ row.title }}</a>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="authorName" label="作者" width="100" />
        <ElTableColumn prop="forumName" label="版块" width="100" />
        <ElTableColumn label="状态" width="120" align="center">
          <template #default="{ row }">
            <ElTag
              :type="
                row.status === 'published'
                  ? 'success'
                  : row.status === 'pending'
                    ? 'warning'
                    : row.status === 'rejected'
                      ? 'danger'
                      : 'info'
              "
              :class="{ 'deleted-tag': row.status === 'deleted' }"
            >
              {{
                row.status === 'draft'
                  ? '草稿'
                  : row.status === 'published'
                    ? '已发布'
                    : row.status === 'pending'
                      ? '待审核'
                      : row.status === 'rejected'
                        ? '已驳回'
                        : '已删除'
              }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="标签" width="120" align="center">
          <template #default="{ row }">
            <ElTag v-if="row.top === 1" type="info">置顶</ElTag>
            <ElTag v-if="row.essence === 1" type="success">加精</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="统计" width="160" align="center">
          <template #default="{ row }">
            <div class="meta">查看 {{ row.viewCount }}</div>
            <div class="meta">点赞 {{ row.likeCount }}</div>
            <div class="meta">评论 {{ row.commentCount }}</div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="createTime" label="创建时间" width="160" />
        <ElTableColumn label="操作" width="240" align="center">
          <template #default="{ row }">
            <ElButton type="primary" plain size="small" @click="() => handleEdit(row)">编辑</ElButton>
            <ElButton type="info" plain size="small" @click="() => handleToggleTop(row)">
              {{ row.top === 1 ? '取消置顶' : '置顶' }}
            </ElButton>
            <ElButton type="info" plain size="small" @click="() => handleToggleEssence(row)">
              {{ row.essence === 1 ? '取消加精' : '加精' }}
            </ElButton>
            <ElButton
              v-if="row.status === 'pending'"
              type="success"
              plain
              size="small"
              @click="() => handleAuditSingle(row, true)"
            >
              通过
            </ElButton>
            <ElButton
              v-if="row.status === 'pending'"
              type="warning"
              plain
              size="small"
              @click="() => handleAuditSingle(row, false)"
            >
              驳回
            </ElButton>
            <ElPopconfirm title="确认删除？" @confirm="() => handleDelete(row)">
              <template #reference>
                <ElButton type="danger" plain size="small">删除</ElButton>
              </template>
            </ElPopconfirm>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="pagination-wrap">
        <CustomPagination v-model:current="current" v-model:page-size="pageSize" :total="total" />
      </div>
    </ElCard>

    <DetailDialog
      v-model:model-value="detailVisible"
      :post-id="detailPostId"
      :mode="detailMode"
      @updated="getPostList"
    />

    <!-- 新增/编辑抽屉 -->
    <ElDrawer v-model="isOpen" :title="isEdit ? '编辑帖子' : '新增帖子'" :size="500">
      <ElForm ref="formRef" :model="form" label-width="auto" label-position="top" class="drawer-form">
        <ElFormItem label="标题">
          <ElInput v-model="form.title" />
        </ElFormItem>
        <ElFormItem label="版块">
          <ElSelect v-model="form.forumId" placeholder="请选择版块">
            <ElOption v-for="f in forums" :key="f.id" :label="f.name" :value="f.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="内容">
          <ElInput v-model="form.content" type="textarea" :rows="8" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status">
            <ElOption label="草稿" value="draft" />
            <ElOption label="已发布" value="published" />
            <ElOption label="待审核" value="pending" />
            <ElOption label="已驳回" value="rejected" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElCheckbox v-model="form.top">置顶</ElCheckbox>
          <ElCheckbox v-model="form.essence">加精</ElCheckbox>
        </ElFormItem>
        <ElFormItem class="drawerFooter">
          <ElButton type="primary" @click="onSubmit">保存</ElButton>
          <ElButton
            @click="
              () => {
                isOpen = false;
              }
            "
          >
            取消
          </ElButton>
        </ElFormItem>
      </ElForm>
    </ElDrawer>
  </div>
</template>

<style scoped lang="scss">
.post-list-page {
  .collapse-search {
    margin-bottom: 10px;
    border-radius: 8px;
    .search-item {
      box-sizing: border-box;
      border-radius: 8px;
      .search-bar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;

        .search-input {
          width: 220px;
        }

        .status-select {
          width: 140px;
        }
      }
    }
  }

  .card-wrapper {
    padding: 10px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;

    .actions-space {
      display: flex;
      flex-wrap: wrap;
      .el-button {
        margin: 4px 8px;
        width: 80px;
      }
    }
  }

  .post-table {
    width: 100%;

    .el-button {
      margin: 4px 8px;
      width: 60px;
    }

    .post-title-link {
      color: var(--el-text-color-primary);
      cursor: pointer;
      text-decoration: none;
    }
  }

  .meta {
    margin: 0 6px;
    color: #666;
  }

  .deleted-tag {
    border: 1px dashed #f56c6c !important;
    color: #f56c6c !important;
    background: transparent !important;
  }

  .pagination-wrap {
    padding-top: 1vw;
    display: flex;
    justify-content: flex-end;
  }

  .drawer-form {
    padding: 12px;
  }

  .drawerFooter {
    margin-top: 12px;
  }
}
</style>
