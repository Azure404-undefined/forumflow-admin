<script setup lang="ts">
defineOptions({ name: 'GlobalLogo' });

interface Props {
  /** Whether to show the title */
  showTitle?: boolean;
}

withDefaults(defineProps<Props>(), {
  showTitle: true
});
</script>

<template>
  <RouterLink to="/" class="w-full flex-y-center nowrap-hidden pl-16px" aria-label="ForumFlow 社区内容管理平台">
    <SystemLogo class="size-32px" />
    <h2 v-show="showTitle" class="pl-8px text-16px text-primary font-bold transition duration-300 ease-in-out">
      ForumFlow
    </h2>
  </RouterLink>
</template>

<style scoped></style>
