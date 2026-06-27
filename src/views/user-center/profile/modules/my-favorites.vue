<script setup lang="ts">
// 资料页·「我的收藏」标签：卡片展示收藏的帖子/评论，触底加载更多
import { ElMessage } from 'element-plus';
import { fetchFavorites } from '@/service/api/profile';
import { useLoadMore } from '../composables/use-load-more';
import FeedList from './feed-list.vue';
import FeedCard from './feed-card.vue';

defineOptions({ name: 'MyFavorites' });

// 收藏对象类型 → 中文标签
const targetTypeLabel: Record<string, string> = {
  post: '帖子',
  comment: '评论'
};

// 触底加载：拉取收藏列表
const { list, loading, finished, loadMore } = useLoadMore<Api.Profile.FavoriteItem>(async (pageNum, pageSize) => {
  const { data, error } = await fetchFavorites({ pageNum, pageSize });
  if (error) {
    ElMessage.error('获取收藏失败');
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
    empty-text="暂无收藏"
    :load-more="loadMore"
  >
    <!-- 每条：上=收藏时间 / 中=标题 / 下=类型标签 -->
    <FeedCard v-for="item in list" :key="item.id" :time="item.collectTime" :title="item.title">
      <template #meta>
        <ElTag size="small" effect="plain">{{ targetTypeLabel[item.targetType] || item.targetType }}</ElTag>
      </template>
    </FeedCard>
  </FeedList>
</template>
