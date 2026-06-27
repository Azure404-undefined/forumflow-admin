<script setup lang="ts">
// 个人资料页（个人中心首页）：顶部横幅 + 下方 6 个内容标签
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { fetchUserProfile, fetchUserStats } from '@/service/api/profile';
import ProfileBanner from '../components/profile-banner.vue';
import ActivityTimeline from './modules/activity-timeline.vue';
import MyPosts from './modules/my-posts.vue';
import MyComments from './modules/my-comments.vue';
import MyFavorites from './modules/my-favorites.vue';
import BrowseHistory from './modules/browse-history.vue';
import OperationLogs from './modules/operation-logs.vue';

const loading = ref(false);
const userInfo = ref<Api.Profile.UserProfile | null>(null);
const stats = ref<Api.Profile.UserStats | null>(null);
// 当前选中的内容标签
const activeTab = ref('timeline');

// 当前用户昵称：作为「我的帖子/我的评论」的作者过滤条件
const authorName = computed(() => userInfo.value?.nickname || '');

// 并发拉取资料与统计，供横幅展示
async function loadProfile() {
  loading.value = true;
  const [profileRes, statsRes] = await Promise.all([fetchUserProfile(), fetchUserStats()]);
  if (profileRes.error) {
    ElMessage.error('获取个人信息失败');
  } else {
    userInfo.value = profileRes.data;
  }
  if (!statsRes.error) {
    stats.value = statsRes.data;
  }
  loading.value = false;
}

onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div class="profile-page">
    <!-- 顶部横幅：头像/信息/统计/编辑资料按钮 -->
    <ElCard v-loading="loading" class="profile-card card-wrapper" shadow="never">
      <ProfileBanner :user-info="userInfo" :stats="stats" />
    </ElCard>

    <!-- 内容标签：每个标签 lazy，首次激活才挂载并请求数据，避免一次性打多个接口 -->
    <ElCard class="content-card card-wrapper" shadow="never">
      <ElTabs v-model="activeTab" class="profile-tabs">
        <ElTabPane label="动态" name="timeline" lazy>
          <ActivityTimeline />
        </ElTabPane>
        <ElTabPane label="我的帖子" name="posts" lazy>
          <MyPosts :author-name="authorName" />
        </ElTabPane>
        <ElTabPane label="我的评论" name="comments" lazy>
          <MyComments :author-name="authorName" />
        </ElTabPane>
        <ElTabPane label="我的收藏" name="favorites" lazy>
          <MyFavorites />
        </ElTabPane>
        <ElTabPane label="浏览历史" name="history" lazy>
          <BrowseHistory />
        </ElTabPane>
        <ElTabPane label="操作日志" name="logs" lazy>
          <OperationLogs />
        </ElTabPane>
      </ElTabs>
    </ElCard>
  </div>
</template>

<style scoped lang="scss">
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 16px;

  // 让封面图铺满卡片（去掉卡片内边距，由 profile-banner 自己控制留白）
  .profile-card {
    :deep(.el-card__body) {
      padding: 0;
    }
  }

  .content-card {
    flex: 1;
  }
}
</style>
