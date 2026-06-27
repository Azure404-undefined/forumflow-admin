<script setup lang="ts">
// 资料页·「动态」标签：以时间线展示用户动态，触底加载更多
import { ElMessage } from 'element-plus';
import { fetchTimeline } from '@/service/api/profile';
import { useLoadMore } from '../composables/use-load-more';
import FeedList from './feed-list.vue';

defineOptions({ name: 'ActivityTimeline' });

// 动态类型 → 标签文案与时间线节点颜色的映射
const typeMeta: Record<string, { label: string; color: string }> = {
  post: { label: '发帖', color: 'var(--el-color-primary)' },
  comment: { label: '评论', color: 'var(--el-color-success)' },
  like: { label: '点赞', color: 'var(--el-color-warning)' },
  follow: { label: '关注', color: 'var(--el-color-danger)' }
};

// 触底加载：每页拉取动态列表，出错提示并结束
const { list, loading, finished, loadMore } = useLoadMore<Api.Profile.TimelineItem>(async (pageNum, pageSize) => {
  const { data, error } = await fetchTimeline({ pageNum, pageSize });
  if (error) {
    ElMessage.error('获取动态失败');
    return null;
  }
  return { list: data?.list || [], total: data?.total || 0 };
});
</script>

<template>
  <FeedList
    :loading="loading"
    :finished="finished"
    :empty="finished && list.length === 0"
    empty-text="暂无动态"
    :load-more="loadMore"
  >
    <!-- 时间线展示：节点颜色按动态类型区分 -->
    <ElTimeline>
      <ElTimelineItem
        v-for="item in list"
        :key="item.id"
        :timestamp="item.createTime"
        :color="typeMeta[item.type]?.color"
        placement="top"
      >
        <div class="timeline-content">
          <div class="timeline-title">
            <!-- 类型标签（发帖/评论/点赞/关注） -->
            <ElTag size="small" effect="plain">{{ typeMeta[item.type]?.label || item.type }}</ElTag>
            <span class="title-text">{{ item.title }}</span>
          </div>
          <p v-if="item.content" class="timeline-desc">{{ item.content }}</p>
        </div>
      </ElTimelineItem>
    </ElTimeline>
  </FeedList>
</template>

<style scoped lang="scss">
.timeline-content {
  .timeline-title {
    display: flex;
    align-items: center;
    gap: 8px;

    .title-text {
      font-weight: 500;
    }
  }

  .timeline-desc {
    margin: 6px 0 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}
</style>
