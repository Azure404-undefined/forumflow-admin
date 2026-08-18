<!-- src/components/common/SafeContent.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import type { Config } from 'dompurify';
import DOMPurify from 'dompurify';

// 允许帖子和评论中包含的标签与属性
const config: Config = {
  ADD_TAGS: ['video', 'source', 'iframe'],
  ADD_ATTR: ['controls', 'autoplay', 'loop', 'muted', 'poster', 'allowfullscreen', 'frameborder', 'scrolling'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.]+(?:[^a-z+.\-:]|$))/i
  // 限制视频只允许来自可信源的 iframe
};

const props = defineProps<{
  html: string;
  // 是否允许 iframe（帖子详情可开，评论关掉）
  allowIframe?: boolean;
}>();

const purifiedHTML = computed(() => {
  let clean = DOMPurify.sanitize(props.html, config);

  // 处理 iframe 白名单
  if (props.allowIframe) {
    clean = whiteListIframes(clean);
  } else {
    clean = removeIframes(clean);
  }

  // 给图片增加懒加载
  clean = addLazyLoadToImages(clean);

  return clean;
});

function whiteListIframes(html: string): string {
  const trustedHosts = new Set(['player.bilibili.com']);
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('iframe').forEach(iframe => {
    const src = iframe.getAttribute('src') || '';
    let isTrusted = false;

    try {
      const normalizedSrc = src.startsWith('//') ? `https:${src}` : src;
      const url = new URL(normalizedSrc, window.location.origin);
      isTrusted = url.protocol === 'https:' && trustedHosts.has(url.hostname);
    } catch {
      isTrusted = false;
    }

    if (!isTrusted) iframe.remove();
    else {
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('scrolling', 'no');
    }
  });
  return div.innerHTML;
}

function removeIframes(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('iframe').forEach(iframe => iframe.remove());
  return div.innerHTML;
}

function addLazyLoadToImages(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('img').forEach(img => {
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
  });
  return div.innerHTML;
}
</script>

<template>
  <!-- DOMPurify sanitizes the HTML before rendering. -->
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="safe-content" v-html="purifiedHTML"></div>
</template>

<style scoped>
.safe-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}
.safe-content :deep(video) {
  max-width: 100%;
  border-radius: 4px;
}
.safe-content :deep(iframe) {
  max-width: 100%;
}
</style>
