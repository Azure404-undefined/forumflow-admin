<script setup lang="ts">
// 资料页·「我的评论」标签：卡片展示本人评论，触底加载更多
import { ElMessage } from 'element-plus';
import { ChatDotRound, Star } from '@element-plus/icons-vue';
import { fetchCommentList } from '@/service/api/profile';
import { useLoadMore } from '../composables/use-load-more';
import FeedList from './feed-list.vue';
import FeedCard from './feed-card.vue';

defineOptions({ name: 'MyComments' });

interface Props {
  /** 当前用户昵称，作为 authorName 传给评论接口以过滤本人内容 */
  authorName?: string;
}

const props = defineProps<Props>();

// 触底加载：按作者拉取本人评论列表
const { list, loading, finished, loadMore } = useLoadMore<Api.Comment.CommentInfo>(async (pageNum, pageSize) => {
  const { data, error } = await fetchCommentList({ pageNum, pageSize, authorName: props.authorName });
  if (error) {
    ElMessage.error('获取评论列表失败');
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
    empty-text="暂无评论"
    :load-more="loadMore"
  >
    <!-- 每条：上=评论时间 / 中=评论内容 / 下=所属帖子·点赞 -->
    <FeedCard v-for="item in list" :key="item.id" :time="item.createTime" :title="item.content">
      <template #meta>
        <span class="meta-item">
          <ElIcon><ChatDotRound /></ElIcon>
          {{ item.postTitle || '—' }}
        </span>
        <span class="meta-item">
          <ElIcon><Star /></ElIcon>
          {{ item.likeCount }}
        </span>
      </template>
    </FeedCard>
  </FeedList>
</template>

<style scoped lang="scss">
// 元信息单项：图标 + 文本
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
