<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { ElMessage, ElMessageBox } from 'element-plus';
import { APP_ROLES, PERMISSION_CODES } from '@/constants/auth';
import { batchDeleteNotice, deleteNotice, editNotice, fetchNoticeList, setNoticeTop } from '@/service/api/notice';
import { useAuthStore } from '@/store/modules/auth';
import { useAuth } from '@/hooks/business/auth';
import CustomPagination from '@/components/custom/pagination.vue';
import NoticeDialog from './components/noticeDialog.vue';

const { hasAuth } = useAuth();
const authStore = useAuthStore();
const noticePermission = PERMISSION_CODES.notice;
const isCommonUser = computed(() => authStore.userInfo.roles.includes(APP_ROLES.common));
const hasNoticeOperations = computed(() =>
  [noticePermission.update, noticePermission.delete, noticePermission.publish, noticePermission.top].some(code =>
    hasAuth(code)
  )
);

// 搜索与分页
const searchForm = reactive({
  title: '',
  status: '' as Api.Notice.NoticeStatus | '',
  top: '' as Api.Notice.TopStatus | '',
  dateRange: []
});
const current = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const activeName = ref('0');

// 表格与选中
const notices = ref<Api.Notice.NoticeInfo[]>([]);
const selectedRows = ref<Api.Notice.NoticeInfo[]>([]);
const tableRef = ref();
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit' | 'view'>('create');
const dialogNoticeId = ref('');

function handleSelectionChange(selection: Api.Notice.NoticeInfo[]) {
  selectedRows.value = selection;
}

function clearAllSelection() {
  tableRef.value?.clearSelection();
}

// 分页 & 列表
async function getNoticeList() {
  notices.value = [];
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
    const res = await fetchNoticeList({
      pageNum: current.value,
      pageSize: pageSize.value,
      title: searchForm.title,
      status: isCommonUser.value ? 'published' : searchForm.status || undefined,
      top: searchForm.top === '' ? undefined : searchForm.top,
      ...dataParams
    });
    notices.value = res.data?.list || [];
    total.value = res.data?.total || 0;
    pageSize.value = res.data?.pageSize || pageSize.value;
  } catch {
    ElMessage.error('获取公告列表失败');
  } finally {
    loading.value = false;
    clearAllSelection();
  }
}

watchDebounced(
  [current, () => searchForm],
  () => {
    getNoticeList();
  },
  { deep: true, debounce: 1000, maxWait: 2000 }
);

watch(pageSize, () => {
  current.value = 1;
});

function resetSearch() {
  searchForm.title = '';
  searchForm.status = '';
  searchForm.top = '';
  searchForm.dateRange = [];
  current.value = 1;
}

// 新增公告
function handleCreate() {
  dialogMode.value = 'create';
  dialogNoticeId.value = '';
  dialogVisible.value = true;
}

// 编辑公告
function handleEdit(row: Api.Notice.NoticeInfo) {
  dialogMode.value = 'edit';
  dialogNoticeId.value = row.id;
  dialogVisible.value = true;
}

function handleView(row: Api.Notice.NoticeInfo) {
  dialogMode.value = 'view';
  dialogNoticeId.value = row.id;
  dialogVisible.value = true;
}

// 删除公告
async function handleDelete(row: Api.Notice.NoticeInfo) {
  try {
    await ElMessageBox.confirm('确定要删除该公告吗？', '提示', { type: 'warning' });
    await deleteNotice(row.id);
    ElMessage.success('删除成功');
    getNoticeList();
  } catch {
    // 取消或失败
  }
}

// 置顶/取消置顶
async function handleToggleTop(row: Api.Notice.NoticeInfo) {
  try {
    const newTop: Api.Notice.TopStatus = row.top === 1 ? 0 : 1;
    await setNoticeTop(row.id, newTop);
    ElMessage.success(newTop === 1 ? '已置顶' : '已取消置顶');
    getNoticeList();
  } catch {
    ElMessage.error('操作失败');
  }
}

// 状态切换（发布/下架）
async function handleToggleStatus(row: Api.Notice.NoticeInfo) {
  try {
    const newStatus: Api.Notice.NoticeStatus = row.status === 'published' ? 'archived' : 'published';
    const statusText = newStatus === 'published' ? '发布' : '下架';
    await editNotice(row.id, {
      title: row.title,
      content: row.content,
      status: newStatus
    });
    ElMessage.success(`已${statusText}`);
    getNoticeList();
  } catch {
    ElMessage.error('操作失败');
  }
}

// 批量删除
async function batchDelete() {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('请先选择至少一项');
    return;
  }
  try {
    await ElMessageBox.confirm('确定要删除选中公告吗？', '提示', { type: 'warning' });
    const ids = selectedRows.value.map(i => i.id);
    await batchDeleteNotice({ ids });
    ElMessage.success('批量删除成功');
    getNoticeList();
    clearAllSelection();
  } catch {
    // 取消或失败
  }
}

const statusLabel = (s: Api.Notice.NoticeStatus | undefined) => {
  switch (s) {
    case 'draft':
      return '草稿';
    case 'published':
      return '已发布';
    case 'archived':
      return '已下架';
    default:
      return '';
  }
};

onMounted(() => {
  getNoticeList();
});
</script>

<template>
  <div class="notice-list-page">
    <!-- 搜索区域 -->
    <ElCard class="collapse-search">
      <ElCollapse v-model="activeName" accordion>
        <ElCollapseItem title="搜索选项" name="1" class="search-item">
          <div class="search-bar">
            <ElInput v-model="searchForm.title" placeholder="按标题搜索" clearable class="search-input" />
            <ElSelect
              v-if="!isCommonUser"
              v-model="searchForm.status"
              placeholder="状态"
              class="status-select"
              clearable
            >
              <ElOption label="草稿" value="draft" />
              <ElOption label="已发布" value="published" />
              <ElOption label="已下架" value="archived" />
            </ElSelect>
            <ElSelect v-model="searchForm.top" placeholder="置顶状态" class="status-select" clearable>
              <ElOption label="已置顶" :value="1" />
              <ElOption label="未置顶" :value="0" />
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

    <!-- 列表区域 -->
    <ElCard class="card-wrapper">
      <div class="card-header">
        <ElText class="mx-1" size="large">公告列表</ElText>
        <div class="actions-space">
          <ElButton type="primary" :loading="loading" @click="getNoticeList">刷新</ElButton>
          <ElButton v-if="hasAuth(noticePermission.create)" type="primary" @click="handleCreate">新增公告</ElButton>
          <ElButton v-if="hasAuth(noticePermission.delete)" type="danger" @click="batchDelete">批量删除</ElButton>
        </div>
      </div>

      <ElTable
        ref="tableRef"
        v-loading="loading"
        :data="notices"
        :row-key="row => row.id"
        height="520"
        element-loading-background="rgba(200, 200, 200, 0.8)"
        class="notice-table"
        @selection-change="handleSelectionChange"
      >
        <ElTableColumn
          v-if="hasAuth(noticePermission.delete)"
          type="selection"
          fixed
          :reserve-selection="true"
          width="50"
        ></ElTableColumn>
        <ElTableColumn label="标题" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="notice-title" @click="() => handleView(row)">{{ row.title }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="row.status === 'published' ? 'success' : row.status === 'archived' ? 'info' : 'warning'">
              {{ statusLabel(row.status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="置顶" width="80" align="center">
          <template #default="{ row }">
            <ElTag v-if="row.top === 1" type="info">置顶</ElTag>
            <span v-else class="text-muted">—</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="creatorName" label="创建者" width="120" />
        <ElTableColumn prop="createTime" label="创建时间" width="160" />
        <ElTableColumn v-if="hasNoticeOperations" label="操作" width="280" align="center">
          <template #default="{ row }">
            <ElButton
              v-if="hasAuth(noticePermission.update)"
              type="primary"
              plain
              size="small"
              @click="() => handleEdit(row)"
            >
              编辑
            </ElButton>
            <ElButton
              v-if="hasAuth(noticePermission.top)"
              type="info"
              plain
              size="small"
              @click="() => handleToggleTop(row)"
            >
              {{ row.top === 1 ? '取消置顶' : '置顶' }}
            </ElButton>
            <ElButton
              v-if="hasAuth(noticePermission.publish)"
              :type="row.status === 'published' ? 'warning' : 'success'"
              plain
              size="small"
              @click="() => handleToggleStatus(row)"
            >
              {{ row.status === 'published' ? '下架' : '发布' }}
            </ElButton>
            <ElPopconfirm v-if="hasAuth(noticePermission.delete)" title="确认删除？" @confirm="() => handleDelete(row)">
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

    <!-- 新增/编辑对话框 -->
    <NoticeDialog
      v-model:model-value="dialogVisible"
      :notice-id="dialogNoticeId"
      :mode="dialogMode"
      @updated="getNoticeList"
    />
  </div>
</template>

<style scoped lang="scss">
.notice-list-page {
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

  .notice-table {
    width: 100%;

    .el-button {
      margin: 4px 2px;
    }

    .notice-title {
      color: var(--el-text-color-primary);
      cursor: pointer;
      font-weight: 500;
    }
  }

  .text-muted {
    color: #999;
  }

  .pagination-wrap {
    padding-top: 1vw;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
