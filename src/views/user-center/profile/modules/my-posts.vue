<script setup lang="ts">
// 资料页·「我的帖子」标签：卡片展示本人帖子，触底加载更多
import { ElMessage } from 'element-plus';
import { ChatDotRound, Star, View } from '@element-plus/icons-vue';
import { fetchPostList } from '@/service/api/profile';
import { useLoadMore } from '../composables/use-load-more';
import FeedList from './feed-list.vue';
import FeedCard from './feed-card.vue';

defineOptions({ name: 'MyPosts' });

interface Props {
  /** 当前用户昵称，作为 authorName 传给帖子接口以过滤本人内容 */
  authorName?: string;
}

const props = defineProps<Props>();

// 触底加载：按作者拉取本人帖子列表
const { list, loading, finished, loadMore } = useLoadMore<Api.Post.PostInfo>(async (pageNum, pageSize) => {
  const { data, error } = await fetchPostList({ pageNum, pageSize, authorName: props.authorName });
  if (error) {
    ElMessage.error('获取帖子列表失败');
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
    empty-text="暂无帖子"
    :load-more="loadMore"
  >
    <!-- 每条：上=发布时间 / 中=标题 / 下=浏览·点赞·评论 -->
    <FeedCard v-for="item in list" :key="item.id" :time="item.createTime" :title="item.title">
      <template #meta>
        <span class="meta-item">
          <ElIcon><View /></ElIcon>
          {{ item.viewCount }}
        </span>
        <span class="meta-item">
          <ElIcon><Star /></ElIcon>
          {{ item.likeCount }}
        </span>
        <span class="meta-item">
          <ElIcon><ChatDotRound /></ElIcon>
          {{ item.commentCount }}
        </span>
      </template>
    </FeedCard>
  </FeedList>
</template>

<style scoped lang="scss">
// 元信息单项：图标 + 数字
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
