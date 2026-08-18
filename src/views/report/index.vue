<script setup lang="ts">
/**
 * 举报管理页（Report Management）
 *
 * 说明：
 * - 本页面用于管理社区中用户提交的举报信息，支持按被举报目标聚合展示、展开查看单条举报、查看被举报的帖子或评论详情，
 *   并对该目标下的所有举报执行“通过/驳回”操作（可填写备注）。
 * - 组件使用 Vue 3 `<script setup>` 语法糖和 Element Plus 组件库。
 */
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { PERMISSION_CODES } from '@/constants/auth';
import { fetchCommentDetail } from '@/service/api/comment';
import { fetchReportDetail, fetchReportList, handleReport } from '@/service/api/report';
import { useAuth } from '@/hooks/business/auth';
import CustomPagination from '@/components/custom/pagination.vue';
import DetailDialog from '../post/components/detailDialog.vue';

const { hasAuth } = useAuth();
const reportPermission = PERMISSION_CODES.report;

// 举报原因类型别名，便于使用映射表
type Reason = Api.Report.ReportReason;

// -------------------------------
// 响应式数据（state）
// -------------------------------
// 搜索筛选表单字段
const searchForm = reactive({
  status: '' as Api.Report.ReportStatus | '',
  targetType: '' as Api.Report.ReportTargetType | '',
  reporterName: ''
});

// 时间范围（开始、结束）
const dateRange = ref<[string, string] | []>([]);

// 列表分页相关
const current = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 全局加载状态（列表 / 抽屉操作 等）
const loading = ref(false);

// 搜索折叠面板激活项（用于控制展开/收起）
const activeName = ref('0');

// 帖子详情弹窗控制及当前帖子 id
const postDetailVisible = ref(false);
const currentPostId = ref('');

// 评论详情弹窗控制与当前评论数据
const commentDetailVisible = ref(false);
const currentComment = ref<Api.Comment.CommentInfo | null>(null);

// 当前在抽屉中查看的被举报目标（聚合）以及抽屉可见性
const currentReport = ref<Api.Report.AggregatedReport>();
const reportDetailVisible = ref(false);

// 抽屉内处理备注
const remark = ref('');

// 报告子项索引（用于抽屉中显示具体某条举报的信息）
const reportChildrenIndex = ref(0);

// -------------------------------
// 映射与常量
// -------------------------------
// 举报原因映射（枚举值 -> 中文描述）
const reasonMap: Record<Reason, string> = {
  spam: '垃圾/广告',
  harassment: '骚扰/人身攻击',
  offensive: '冒犯性内容',
  misinformation: '虚假/误导',
  illegal: '违法内容',
  other: '其他'
};

// 被举报目标类型映射
const typeMap: Record<Api.Report.ReportTargetType, string> = {
  post: '帖子',
  comment: '评论'
};

// 后端返回的聚合举报列表（每个元素代表同一个目标下的多条举报）
const reports = ref<Api.Report.AggregatedReport[]>([]);

// -------------------------------
// 工具函数（格式化显示）
// -------------------------------
/** 将目标类型转换为可读标签 */
function typeLabel(type: Api.Report.ReportTargetType) {
  return typeMap[type] || type;
}

/** 将举报原因转换为可读标签 */
function reasonLabel(r: Reason) {
  return reasonMap[r] || r;
}

// -------------------------------
// 搜索与分页操作
// -------------------------------
/** 执行查询（或点击查询按钮）: 重置到第一页并刷新列表 */
function handleSearch() {
  current.value = 1;
  refresh();
}

/** 重置搜索条件并刷新 */
function resetSearch() {
  searchForm.status = '';
  searchForm.targetType = '';
  searchForm.reporterName = '';
  dateRange.value = [];
  current.value = 1;
  refresh();
}

// -------------------------------
// 数据请求：拉取举报列表
// -------------------------------
/**
 * 拉取举报聚合列表
 * - 会根据 `searchForm`、`dateRange`、`current`、`pageSize` 发起请求
 * - 成功后更新 `reports` 和 `total`
 */
async function refresh() {
  loading.value = true;
  try {
    const res = await fetchReportList({
      status: searchForm.status || undefined,
      targetType: searchForm.targetType || undefined,
      reporterName: searchForm.reporterName || undefined,
      startTime: dateRange.value[0] || undefined,
      endTime: dateRange.value[1] || undefined,
      pageNum: current.value,
      pageSize: pageSize.value
    });
    reports.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } catch {
    ElMessage.error('获取举报列表失败');
  } finally {
    loading.value = false;
  }
}

// -------------------------------
// 批量处理（对某一被举报目标下的所有举报）
// -------------------------------
/** 在表格行上执行通过操作（提示确认） */
function handleApprove(item: Api.Report.AggregatedReport) {
  ElMessageBox.confirm('确认对该目标下所有举报执行“通过”操作吗？', '处理举报', {
    type: 'warning'
  })
    .then(async () => {
      try {
        await handleReport({
          targetIds: [item.targetId],
          action: 'approve'
        });
        ElMessage.success('已通过');
        refresh();
      } catch {
        ElMessage.error('处理举报失败');
      }
    })
    .catch(() => {});
}

/** 在表格行上执行驳回操作（提示确认） */
function handleReject(item: Api.Report.AggregatedReport) {
  ElMessageBox.confirm('确认对该目标下所有举报执行“驳回”操作吗？', '处理举报', {
    type: 'warning'
  })
    .then(async () => {
      try {
        await handleReport({
          targetIds: [item.targetId],
          action: 'reject'
        });
        ElMessage.success('已驳回');
        refresh();
      } catch {
        ElMessage.error('处理举报失败');
      }
    })
    .catch(() => {});
}

// -------------------------------
// 抽屉内操作（单个聚合目标的详情与处理）
// -------------------------------
/** 关闭抽屉并清空备注 */
function drawerCancel() {
  reportDetailVisible.value = false;
  remark.value = '';
}

/** 抽屉内执行通过（可填写备注） */
function drawerApprove() {
  if (!currentReport.value) return;
  ElMessageBox.confirm('确认对该目标下所有举报执行“通过”操作吗？', '处理举报', {
    type: 'warning'
  })
    .then(async () => {
      loading.value = true;
      try {
        await handleReport({
          targetIds: [currentReport.value!.targetId],
          action: 'approve',
          remark: remark.value || undefined
        });
        // 处理后刷新抽屉内的目标详情
        const res = await fetchReportDetail(currentReport.value!.targetId);
        currentReport.value = res.data || undefined;
        ElMessage.success('已通过');
        refresh();
      } catch {
        ElMessage.error('处理举报失败');
      } finally {
        loading.value = false;
      }
    })
    .catch(() => {});
}

/** 抽屉内执行驳回（可填写备注） */
function drawerReject() {
  if (!currentReport.value) return;
  ElMessageBox.confirm('确认对该目标下所有举报执行“驳回”操作吗？', '处理举报', {
    type: 'warning'
  })
    .then(async () => {
      loading.value = true;
      try {
        await handleReport({
          targetIds: [currentReport.value!.targetId],
          action: 'reject',
          remark: remark.value || undefined
        });
        // 处理后刷新抽屉内的目标详情
        const res = await fetchReportDetail(currentReport.value!.targetId);
        currentReport.value = res.data || undefined;
        ElMessage.success('已驳回');
        refresh();
      } catch {
        ElMessage.error('处理举报失败');
      } finally {
        loading.value = false;
      }
    })
    .catch(() => {});
}

// -------------------------------
// 查看被举报目标（帖子/评论）
// -------------------------------
/**
 * 查看目标内容：
 * - 如果是帖子，打开帖子详情弹窗
 * - 如果是评论，先请求评论详情再打开评论弹窗
 */
async function viewTarget(row: Api.Report.AggregatedReport) {
  if (row.targetType === 'post') {
    currentPostId.value = row.targetId;
    postDetailVisible.value = true;
  } else {
    try {
      const res = await fetchCommentDetail(row.targetId);
      currentComment.value = res.data;
      commentDetailVisible.value = true;
    } catch {
      ElMessage.error('获取评论详情失败');
    }
  }
}

/** 在展开列表中查看子举报对应的聚合目标并打开抽屉 */
function viewChildrenReport(row: Api.Report.ReportDetail) {
  const detailReport = reports.value.find(item => item.children?.some(child => child.id === row.id));
  const index = detailReport?.children?.findIndex(child => child.id === row.id) || 0;
  viewReport(detailReport!, index);
}

/** 打开抽屉查看某个聚合目标的举报详情 */
function viewReport(row: Api.Report.AggregatedReport, index: number) {
  try {
    currentReport.value = row;
    reportChildrenIndex.value = index;
    reportDetailVisible.value = true;
  } catch {
    ElMessage.error('获取举报详情失败');
  }
}

// -------------------------------
// 监听器与生命周期
// -------------------------------
// 当分页或页大小变化时，重新拉取列表
watch([current, pageSize], () => {
  refresh();
});

// 组件挂载时加载初始数据
onMounted(() => {
  refresh();
});
</script>

<template>
  <div class="report-page">
    <ElCard class="collapse-search">
      <ElCollapse v-model="activeName" accordion>
        <ElCollapseItem title="搜索选项" name="1" class="search-item">
          <div class="search-bar">
            <ElSelect v-model="searchForm.status" placeholder="处理状态" clearable class="status-select">
              <ElOption label="待处理" value="pending" />
              <ElOption label="已通过" value="approved" />
              <ElOption label="已驳回" value="rejected" />
            </ElSelect>
            <ElSelect v-model="searchForm.targetType" placeholder="举报类型" clearable class="status-select">
              <ElOption label="帖子" value="post" />
              <ElOption label="评论" value="comment" />
            </ElSelect>
            <ElInput v-model="searchForm.reporterName" placeholder="举报人" clearable class="search-input" />
            <ElDatePicker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
            <ElButton type="primary" @click="handleSearch">查询</ElButton>
            <ElButton @click="resetSearch">重置</ElButton>
          </div>
        </ElCollapseItem>
      </ElCollapse>
    </ElCard>

    <ElCard class="card-wrapper">
      <div class="card-header">
        <ElText size="large">举报管理</ElText>
        <div class="actions-space">
          <ElButton type="primary" @click="refresh">刷新</ElButton>
        </div>
      </div>

      <ElTable v-loading="loading" :data="reports" row-key="targetId" stripe>
        <ElTableColumn type="expand" width="40">
          <template #default="{ row }">
            <div class="children-wrap">
              <ElTable :data="row.children" size="small" border>
                <ElTableColumn prop="reporterName" label="举报人" width="140" />
                <ElTableColumn prop="createTime" label="举报时间" width="180" />
                <ElTableColumn label="举报原因">
                  <template #default="{ row: child }">
                    <div>{{ reasonLabel(child.reason) }}</div>
                    <div v-if="child.reasonDesc" class="desc">{{ child.reasonDesc }}</div>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="操作" width="240" align="center">
                  <template #default="{ row: view }">
                    <ElButton type="info" plain size="small" @click="viewChildrenReport(view)">查看举报信息</ElButton>
                  </template>
                </ElTableColumn>
              </ElTable>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="举报对象" width="110" align="center">
          <template #default="{ row }">
            <div>{{ typeLabel(row.targetType) }}</div>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="targetTitle" label="对象标题" show-overflow-tooltip>
          <template #default="{ row }">
            <ElButton link type="default" @click="viewTarget(row)">{{ row.targetTitle }}</ElButton>
          </template>
        </ElTableColumn>

        <ElTableColumn label="举报次数" width="120" align="center">
          <template #default="{ row }">{{ row.reportCount }}</template>
        </ElTableColumn>

        <ElTableColumn label="举报原因" width="160">
          <template #default="{ row }">{{ reasonLabel(row.latestReason) }}</template>
        </ElTableColumn>

        <ElTableColumn label="状态" width="140" align="center">
          <template #default="{ row }">
            <ElTag :type="row.status === 'approved' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'">
              {{ row.status === 'pending' ? '待处理' : row.status === 'approved' ? '已通过' : '已驳回' }}
            </ElTag>
            <div v-if="row.handlerName && row.status !== 'pending'" class="handler">
              {{ row.handlerName }} {{ row.handleTime }}
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="操作" width="240" align="center">
          <template #default="{ row }">
            <ElButton type="info" plain size="small" @click="viewReport(row, 0)">查看详情</ElButton>
            <ElButton
              v-if="row.status === 'pending' && hasAuth(reportPermission.handle)"
              type="success"
              plain
              size="small"
              @click="() => handleApprove(row)"
            >
              通过
            </ElButton>
            <ElButton
              v-if="row.status === 'pending' && hasAuth(reportPermission.handle)"
              type="warning"
              plain
              size="small"
              @click="() => handleReject(row)"
            >
              驳回
            </ElButton>
            <ElButton v-else-if="row.status !== 'pending'" type="info" plain size="small" disabled>已处理</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <div class="pagination-wrap">
        <CustomPagination v-model:current="current" v-model:page-size="pageSize" :total="total" />
      </div>
    </ElCard>

    <DetailDialog v-model="postDetailVisible" :post-id="currentPostId" mode="view"></DetailDialog>

    <ElDialog v-model="commentDetailVisible" title="评论详情" width="min(500px, 94vw)">
      <div v-if="currentComment" class="comment-detail">
        <div class="comment-content">评论内容：{{ currentComment.content }}</div>
        <div class="comment-info">
          <ElButton
            link
            type="default"
            @click="
              () => {
                postDetailVisible = true;
                currentPostId = currentComment!.postId;
              }
            "
          >
            所属帖子：{{ currentComment.postTitle }}
          </ElButton>

          <div>评论人：{{ currentComment.authorName }}</div>
        </div>
      </div>
    </ElDialog>

    <ElDrawer v-model="reportDetailVisible" title="举报详情" size="380px" class="reportDetail-drawer">
      <div v-loading="loading" class="report-detail-drawer">
        <ElCard class="card-drawer-message">
          <template #header>
            <span>举报信息</span>
          </template>
          <div class="reporter">
            <div>举报ID：{{ currentReport?.targetId }}</div>
            <div>举报类型：{{ typeLabel(currentReport!.targetType) }}</div>
            <div>举报人：{{ currentReport?.children[reportChildrenIndex].reporterName }}</div>
            <div>举报原因：{{ reasonLabel(currentReport!.children[reportChildrenIndex].reason) }}</div>
          </div>
          <div class="reason">
            <div>举报时间：{{ currentReport?.children[reportChildrenIndex].createTime }}</div>
            <div>详细描述：{{ currentReport?.children[reportChildrenIndex].reasonDesc }}</div>
          </div>
        </ElCard>
        <ElCard class="card-drawer-target">
          <template #header>
            <span>被举报内容（{{ typeLabel(currentReport!.targetType) }}）</span>
          </template>
          <ElButton link type="default" @click="viewTarget(currentReport!)">
            内容详情：{{ currentReport!.targetTitle }}
          </ElButton>
          <div class="count">
            <div>内容标题：{{ currentReport?.targetTitle }}</div>
            <div>被举报数：{{ currentReport?.reportCount }}</div>
          </div>
        </ElCard>
        <ElCard class="card-drawer-action">
          <template #header>
            <span>处理信息</span>
          </template>
          <div class="handler-info">
            <div>
              处理状态：
              <ElTag
                :type="
                  currentReport?.status === 'approved'
                    ? 'success'
                    : currentReport?.status === 'pending'
                      ? 'warning'
                      : 'danger'
                "
              >
                {{
                  currentReport?.status === 'pending'
                    ? '待处理'
                    : currentReport?.status === 'approved'
                      ? '已通过'
                      : '已驳回'
                }}
              </ElTag>
            </div>
            <div v-if="currentReport?.status !== 'pending'">处理人：{{ currentReport?.handlerName }}</div>
          </div>
          <div v-if="currentReport?.status !== 'pending'">处理时间：{{ currentReport?.handleTime }}</div>
          <div>处理备注（选填）</div>
          <ElInput
            v-model="remark"
            class="textarea"
            :rows="3"
            type="textarea"
            placeholder="状态处理描述..."
            :disabled="!hasAuth(reportPermission.handle)"
          />
        </ElCard>
        <div class="report-button">
          <ElButton type="default" size="large" @click="drawerCancel">取消</ElButton>
          <ElButton
            v-if="currentReport?.status === 'pending' && hasAuth(reportPermission.handle)"
            type="danger"
            size="large"
            @click="drawerApprove"
          >
            通过举报
          </ElButton>
          <ElButton
            v-if="currentReport?.status === 'pending' && hasAuth(reportPermission.handle)"
            type="primary"
            size="large"
            @click="drawerReject"
          >
            驳回举报
          </ElButton>
        </div>
      </div>
    </ElDrawer>
  </div>
</template>

<style scoped lang="scss">
.report-page {
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

  :deep(.el-table__placeholder) {
    display: none;
  }

  .card-wrapper {
    padding: 12px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .children-wrap {
    padding: 8px 12px;
    background: #fafafa;
  }

  .desc {
    color: #666;
    font-size: 13px;
    margin-top: 4px;
  }

  .handler {
    font-size: 12px;
    color: #888;
    margin-top: 6px;
  }

  .comment-detail {
    .comment-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 12px;

      :deep(.el-button) {
        min-width: 0;
        max-width: 100%;
      }

      :deep(.el-button > span) {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      > div {
        flex-shrink: 0;
        white-space: nowrap;
      }
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: flex-end;
    padding-top: 12px;
  }

  //   .reportDetail-drawer {
  :deep(.el-drawer__header) {
    margin-bottom: 8px;
  }
  //   }

  .report-detail-drawer {
    display: grid;
    grid-template-rows: 200px 200px 1fr;
    gap: 12px;
    .card-drawer-message,
    .card-drawer-target,
    .card-drawer-action {
      background-color: #f0f0f0;
      .textarea {
        margin-top: 12px;
      }
    }
    .reporter {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .reason div {
      margin-top: 12px;
    }
    .count {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-top: 12px;
    }
    .handler-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .report-button {
      margin-top: 12px;
      // display: flex;
      // justify-content: space-between;
    }
  }
}
</style>
