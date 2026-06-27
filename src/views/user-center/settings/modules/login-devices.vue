<script setup lang="ts">
// 设置页·「登录设备」：只读展示当前账号的登录会话/设备（无下线接口）
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { fetchSessions } from '@/service/api/profile';

defineOptions({ name: 'LoginDevices' });

const list = ref<Api.Profile.SessionItem[]>([]);
const loading = ref(false);

// 拉取会话/设备列表
async function loadData() {
  loading.value = true;
  const { data, error } = await fetchSessions();
  if (error) {
    ElMessage.error('获取登录设备失败');
    list.value = [];
  } else {
    list.value = data || [];
  }
  loading.value = false;
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div v-loading="loading" class="login-devices">
    <!-- 空态 -->
    <ElEmpty v-if="!loading && list.length === 0" description="暂无登录设备" />
    <!-- 设备表：设备 / 浏览器 / IP / 登录时间 / 状态（当前设备） -->
    <ElTable v-else :data="list" border>
      <ElTableColumn prop="device" label="设备" min-width="160" show-overflow-tooltip />
      <ElTableColumn prop="browser" label="浏览器" min-width="160" show-overflow-tooltip />
      <ElTableColumn prop="ip" label="IP 地址" width="150" />
      <ElTableColumn prop="loginTime" label="登录时间" width="180" />
      <ElTableColumn label="状态" width="120">
        <template #default="{ row }">
          <!-- 当前登录设备高亮标记 -->
          <ElTag v-if="row.isCurrent" type="success" size="small">当前设备</ElTag>
          <span v-else>—</span>
        </template>
      </ElTableColumn>
    </ElTable>
  </div>
</template>

<style scoped lang="scss">
.login-devices {
  min-height: 200px;
}
</style>
