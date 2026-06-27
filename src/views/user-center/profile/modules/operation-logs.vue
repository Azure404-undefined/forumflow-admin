<script setup lang="ts">
// 资料页·「操作日志」标签：表格展示账号操作审计，唯一保留「分页」的列表（其余列表为触底加载）
import { onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { fetchUserLogs } from '@/service/api/profile';
import CustomPagination from '@/components/custom/pagination.vue';

defineOptions({ name: 'OperationLogs' });

const list = ref<Api.Profile.LogItem[]>([]);
const total = ref(0);
const loading = ref(false);
// 分页：当前页与每页数量
const current = ref(1);
const pageSize = ref(10);

// 按当前分页拉取日志
async function loadData() {
  loading.value = true;
  const { data, error } = await fetchUserLogs({ pageNum: current.value, pageSize: pageSize.value });
  if (error) {
    ElMessage.error('获取操作日志失败');
    list.value = [];
    total.value = 0;
  } else {
    list.value = data?.list || [];
    total.value = data?.total || 0;
  }
  loading.value = false;
}

// 改每页数量时回到第一页再加载
watch(pageSize, () => {
  current.value = 1;
  loadData();
});

// 翻页时重新加载
watch(current, () => {
  loadData();
});

onMounted(() => {
  loadData();
});
</script>

<template>
  <div v-loading="loading" class="operation-logs">
    <!-- 空态 -->
    <ElEmpty v-if="!loading && list.length === 0" description="暂无操作日志" />
    <template v-else>
      <!-- 日志表：操作 / 对象 / IP / 设备 / 时间 -->
      <ElTable :data="list" border>
        <ElTableColumn prop="action" label="操作" width="140" show-overflow-tooltip />
        <ElTableColumn prop="target" label="操作对象" min-width="160" show-overflow-tooltip />
        <ElTableColumn prop="ip" label="IP 地址" width="140" />
        <ElTableColumn prop="userAgent" label="设备信息" min-width="200" show-overflow-tooltip />
        <ElTableColumn prop="createTime" label="操作时间" width="180" />
      </ElTable>

      <!-- 分页器 -->
      <div class="pagination-wrapper">
        <CustomPagination v-model:current="current" v-model:page-size="pageSize" :total="total" />
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.operation-logs {
  min-height: 200px;

  .pagination-wrapper {
    margin-top: 16px;
  }
}
</style>
