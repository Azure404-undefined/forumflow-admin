<script setup lang="ts">
// 个人设置页：顶部共享横幅 +（桌面）左竖列 Tab/右表单 /（移动端）钻取式列表→表单
import { computed, onMounted, ref } from 'vue';
import { ArrowLeft, ArrowRight, Lock, Monitor, User, View } from '@element-plus/icons-vue';
import { fetchUserProfile, fetchUserStats } from '@/service/api/profile';
import { useAppStore } from '@/store/modules/app';
import ProfileBanner from '../components/profile-banner.vue';
import BasicInfo from './modules/basic-info.vue';
import ChangePassword from './modules/change-password.vue';
import LoginDevices from './modules/login-devices.vue';
import PrivacySettings from './modules/privacy-settings.vue';

// 用于判断移动端，切换两种布局
const appStore = useAppStore();

// 选项卡配置：桌面 Tab 与移动端列表共用（key/标题/图标/对应表单组件）
const tabs = [
  { key: 'basic', label: '基本信息', icon: User, comp: BasicInfo },
  { key: 'password', label: '修改密码', icon: Lock, comp: ChangePassword },
  { key: 'devices', label: '登录设备', icon: Monitor, comp: LoginDevices },
  { key: 'privacy', label: '隐私设置', icon: View, comp: PrivacySettings }
];

const userInfo = ref<Api.Profile.UserProfile | null>(null);
const stats = ref<Api.Profile.UserStats | null>(null);

// 桌面端左侧竖列 Tab 选中项
const activeTab = ref('basic');
// 移动端钻取：null = 显示列表；否则显示对应表单
const mobileActive = ref<string | null>(null);

// 移动端当前选中的选项卡（用于渲染标题与对应表单）
const currentTab = computed(() => tabs.find(t => t.key === mobileActive.value) ?? null);

// 拉取资料与统计供横幅展示
async function loadBanner() {
  const [profileRes, statsRes] = await Promise.all([fetchUserProfile(), fetchUserStats()]);
  if (!profileRes.error) {
    userInfo.value = profileRes.data;
  }
  if (!statsRes.error) {
    stats.value = statsRes.data;
  }
}

onMounted(() => {
  loadBanner();
});
</script>

<template>
  <div class="settings-page">
    <!-- 横幅：PC 含统计 + 「返回个人中心」；移动端精简为仅头像 + 信息 -->
    <ElCard class="banner-card card-wrapper" shadow="never">
      <ProfileBanner :user-info="userInfo" :stats="stats" action="back" :compact-mobile="true" />
    </ElCard>

    <ElCard class="tabs-card card-wrapper" shadow="never">
      <!-- 桌面端：左侧竖列 Tab + 右侧表单 -->
      <ElTabs v-if="!appStore.isMobile" v-model="activeTab" tab-position="left" class="settings-tabs">
        <ElTabPane v-for="t in tabs" :key="t.key" :name="t.key" lazy>
          <template #label>
            <span class="tab-label">
              <ElIcon><component :is="t.icon" /></ElIcon>
              {{ t.label }}
            </span>
          </template>
          <div class="tab-content">
            <component :is="t.comp" />
          </div>
        </ElTabPane>
      </ElTabs>

      <!-- 移动端：钻取式（先列表，点选后进入对应表单，可返回列表） -->
      <div v-else class="mobile-settings">
        <!-- 列表：未选中任何项时显示 -->
        <div v-if="!currentTab" class="mobile-list">
          <div v-for="t in tabs" :key="t.key" class="mobile-item" @click="mobileActive = t.key">
            <ElIcon class="item-icon"><component :is="t.icon" /></ElIcon>
            <span class="item-label">{{ t.label }}</span>
            <ElIcon class="item-arrow"><ArrowRight /></ElIcon>
          </div>
        </div>

        <!-- 详情：选中后显示「返回 + 标题」头 + 对应表单 -->
        <div v-else class="mobile-detail">
          <div class="detail-head">
            <ElButton link @click="mobileActive = null">
              <ElIcon><ArrowLeft /></ElIcon>
              返回
            </ElButton>
            <span class="detail-title">{{ currentTab.label }}</span>
            <span class="placeholder"></span>
          </div>
          <component :is="currentTab.comp" />
        </div>
      </div>
    </ElCard>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 16px;

  // 让封面图铺满卡片
  .banner-card {
    :deep(.el-card__body) {
      padding: 0;
    }
  }

  .tabs-card {
    flex: 1;
  }
}

.settings-tabs {
  min-height: 360px;

  .tab-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .tab-content {
    padding: 4px 8px;
  }

  // 左侧 Tab 文案左对齐
  :deep(.el-tabs__item) {
    justify-content: flex-start;
  }
}

.mobile-settings {
  // 列表项：图标 + 名称 + 右箭头
  .mobile-list {
    .mobile-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 4px;
      cursor: pointer;
      border-bottom: 1px solid var(--el-border-color-lighter);
      transition: background-color 0.2s;

      &:active {
        background-color: var(--el-fill-color-light);
      }

      .item-icon {
        font-size: 18px;
        color: var(--el-color-primary);
      }

      .item-label {
        flex: 1;
        font-size: 15px;
        color: var(--el-text-color-primary);
      }

      .item-arrow {
        color: var(--el-text-color-secondary);
      }
    }
  }

  // 详情头：返回 + 标题（placeholder 用于标题居中占位）
  .mobile-detail {
    .detail-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .detail-title {
        font-size: 16px;
        font-weight: 600;
      }

      .placeholder {
        width: 56px;
      }
    }
  }
}
</style>
