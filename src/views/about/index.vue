<script setup lang="ts">
import { computed } from 'vue';
import pkg from '~/package.json';

defineOptions({ name: 'AboutPage' });

const latestBuildTime = BUILD_TIME;
const liveDemoUrl = computed(() => pkg.website.trim());

const moderationFlow = ['内容进入', '权限校验', '审核处理', '数据复盘'];

const coreModules = [
  {
    icon: 'mdi:account-group-outline',
    title: '用户与角色',
    description: '用户状态、角色分配、按钮权限和受保护账号操作约束。'
  },
  {
    icon: 'mdi:shield-check-outline',
    title: '内容审核',
    description: '覆盖帖子、评论和举报处理，并提供批量审核与详情核验。'
  },
  {
    icon: 'mdi:forum-outline',
    title: '社区配置',
    description: '管理板块层级、公告发布和业务配置，普通用户保持只读体验。'
  },
  {
    icon: 'mdi:chart-box-outline',
    title: '运营与个人中心',
    description: '看板统计与固定数据关联，个人资料、动态和安全设置保持身份一致。'
  }
];

const engineeringHighlights = [
  '静态路由 RBAC 与按钮级权限矩阵',
  'TypeScript API 类型契约与请求封装',
  '68 个自包含 Apifox 固定 Mock 脚本',
  'DOMPurify 净化与 iframe 域名白名单',
  '桌面端和移动端核心业务路由适配',
  '确定性筛选、分页和关联演示数据'
];

const techStack = [
  'Vue 3',
  'TypeScript',
  'Vite 7',
  'Element Plus',
  'Pinia',
  'Vue Router',
  'UnoCSS',
  'Apifox Mock',
  'WangEditor',
  'DOMPurify'
];
</script>

<template>
  <div class="about-page">
    <ElCard class="hero-card" shadow="never">
      <div class="hero-layout">
        <div class="hero-copy">
          <div class="brand-line">
            <SystemLogo class="brand-logo" />
            <span>COMMUNITY OPERATIONS</span>
          </div>
          <h1>让社区内容治理更清晰、更可验证</h1>
          <p>
            ForumFlow 是一个基于 Vue 3、TypeScript 和 Element Plus
            实现的社区内容管理平台，覆盖内容审核、用户与角色管理、板块配置、公告管理、数据看板和个人中心等模块。
          </p>
          <div class="hero-actions">
            <ElButton tag="a" :href="pkg.homepage" target="_blank" rel="noopener noreferrer" type="primary">
              <template #icon><SvgIcon icon="mdi:github" /></template>
              查看源码
            </ElButton>
            <ElButton v-if="liveDemoUrl" tag="a" :href="liveDemoUrl" target="_blank" rel="noopener noreferrer">
              在线演示
            </ElButton>
            <ElTag v-else effect="plain" round>在线演示部署后补充</ElTag>
          </div>
        </div>

        <div class="flow-panel" aria-label="内容治理流程">
          <p class="flow-title">内容治理闭环</p>
          <ol>
            <li v-for="(item, index) in moderationFlow" :key="item">
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              <strong>{{ item }}</strong>
            </li>
          </ol>
        </div>
      </div>
    </ElCard>

    <div class="evidence-strip">
      <div>
        <strong>3 类</strong>
        <span>演示角色</span>
      </div>
      <div>
        <strong>68 个</strong>
        <span>固定 Mock 脚本</span>
      </div>
      <div>
        <strong>12 条</strong>
        <span>关联帖子基线</span>
      </div>
      <div>
        <strong>双端</strong>
        <span>桌面与移动适配</span>
      </div>
    </div>

    <section>
      <div class="section-heading">
        <span>CORE MODULES</span>
        <h2>核心业务模块</h2>
      </div>
      <div class="module-grid">
        <ElCard v-for="item in coreModules" :key="item.title" class="module-card" shadow="never">
          <div class="module-icon"><SvgIcon :icon="item.icon" /></div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </ElCard>
      </div>
    </section>

    <div class="detail-grid">
      <ElCard shadow="never" class="detail-card">
        <template #header>
          <div class="card-heading">
            <SvgIcon icon="mdi:tools" />
            <span>工程实现</span>
          </div>
        </template>
        <ul class="highlight-list">
          <li v-for="item in engineeringHighlights" :key="item">
            <SvgIcon icon="mdi:check-circle-outline" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </ElCard>

      <ElCard shadow="never" class="detail-card">
        <template #header>
          <div class="card-heading">
            <SvgIcon icon="mdi:source-branch" />
            <span>技术栈与版本</span>
          </div>
        </template>
        <div class="tech-list">
          <ElTag v-for="item in techStack" :key="item" effect="plain" round>{{ item }}</ElTag>
        </div>
        <ElDescriptions class="project-meta" :column="1" size="small">
          <ElDescriptionsItem label="当前版本">v{{ pkg.version }}</ElDescriptionsItem>
          <ElDescriptionsItem label="最近构建">{{ latestBuildTime }}</ElDescriptionsItem>
          <ElDescriptionsItem label="开源协议">MIT</ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>
    </div>

    <ElCard shadow="never" class="source-card">
      <div>
        <strong>技术来源与致谢</strong>
        <p>
          项目采用 SoybeanAdmin ElementPlus 作为工程化基础，业务页面、API
          与类型契约、权限控制、固定演示数据、富文本安全渲染及移动端适配由本项目完成；上游项目遵循 MIT 协议。
        </p>
      </div>
      <a href="https://github.com/soybeanjs/soybean-admin-element-plus" target="_blank" rel="noopener noreferrer">
        查看上游项目
        <SvgIcon icon="mdi:arrow-top-right" />
      </a>
    </ElCard>
  </div>
</template>

<style scoped>
.about-page {
  --about-ink: rgb(var(--base-text-color));
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-card {
  overflow: hidden;
  border: 1px solid rgb(var(--primary-200-color) / 45%);
  background:
    radial-gradient(circle at 86% 12%, rgb(var(--primary-300-color) / 25%), transparent 31%),
    linear-gradient(135deg, transparent, rgb(var(--container-bg-color)) 55%);
}

.hero-card :deep(.el-card__body) {
  padding: clamp(24px, 4vw, 48px);
}

.hero-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.75fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
}

.brand-line {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgb(var(--primary-color));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.brand-logo {
  width: 42px;
  height: 42px;
}

.hero-copy h1 {
  max-width: 720px;
  margin: 24px 0 16px;
  color: var(--about-ink);
  font-size: clamp(30px, 4vw, 52px);
  font-weight: 750;
  letter-spacing: -0.04em;
  line-height: 1.15;
}

.hero-copy > p {
  max-width: 760px;
  margin: 0;
  color: rgb(var(--base-text-color) / 70%);
  font-size: 16px;
  line-height: 1.9;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-top: 28px;
}

.flow-panel {
  padding: 22px;
  border: 1px solid rgb(var(--primary-200-color) / 65%);
  border-radius: 18px;
  background: rgb(var(--container-bg-color) / 80%);
  box-shadow: 0 18px 50px rgb(var(--primary-color) / 10%);
  backdrop-filter: blur(12px);
}

.flow-title {
  margin: 0 0 16px;
  color: rgb(var(--base-text-color) / 56%);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.flow-panel ol {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.flow-panel li {
  position: relative;
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 12px;
  align-items: center;
  min-height: 48px;
}

.flow-panel li:not(:last-child)::after {
  position: absolute;
  top: 35px;
  bottom: -13px;
  left: 15px;
  width: 1px;
  background: rgb(var(--primary-300-color));
  content: '';
}

.flow-panel li span {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50%;
  background: rgb(var(--primary-100-color));
  color: rgb(var(--primary-700-color));
  font-size: 11px;
  font-weight: 700;
}

.flow-panel li strong {
  color: var(--about-ink);
  font-size: 14px;
}

.evidence-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: rgb(var(--container-bg-color));
}

.evidence-strip > div {
  display: flex;
  gap: 8px;
  align-items: baseline;
  justify-content: center;
  padding: 18px 14px;
}

.evidence-strip > div + div {
  border-left: 1px solid var(--el-border-color);
}

.evidence-strip strong {
  color: rgb(var(--primary-color));
  font-size: 17px;
}

.evidence-strip span {
  color: rgb(var(--base-text-color) / 62%);
  font-size: 13px;
}

.section-heading {
  margin: 8px 0 14px;
}

.section-heading span {
  color: rgb(var(--primary-color));
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.section-heading h2 {
  margin: 6px 0 0;
  color: var(--about-ink);
  font-size: 22px;
}

.module-grid,
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.module-card,
.detail-card,
.source-card {
  border-color: var(--el-border-color);
}

.module-card :deep(.el-card__body) {
  padding: 22px;
}

.module-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 12px;
  background: rgb(var(--primary-100-color));
  color: rgb(var(--primary-700-color));
  font-size: 22px;
}

.module-card h3 {
  margin: 16px 0 8px;
  color: var(--about-ink);
  font-size: 16px;
}

.module-card p,
.source-card p {
  margin: 0;
  color: rgb(var(--base-text-color) / 64%);
  line-height: 1.75;
}

.card-heading {
  display: flex;
  gap: 10px;
  align-items: center;
  color: var(--about-ink);
  font-weight: 650;
}

.card-heading .svg-icon {
  color: rgb(var(--primary-color));
  font-size: 20px;
}

.highlight-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.highlight-list li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  color: rgb(var(--base-text-color) / 76%);
  line-height: 1.6;
}

.highlight-list .svg-icon {
  flex: 0 0 auto;
  margin-top: 3px;
  color: rgb(var(--success-color));
}

.tech-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.project-meta {
  margin-top: 20px;
}

.source-card :deep(.el-card__body) {
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
}

.source-card strong {
  display: block;
  margin-bottom: 6px;
  color: var(--about-ink);
}

.source-card a {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 4px;
  align-items: center;
  color: rgb(var(--primary-color));
}

@media (max-width: 900px) {
  .hero-layout,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .evidence-strip {
    grid-template-columns: repeat(2, 1fr);
  }

  .evidence-strip > div:nth-child(3) {
    border-top: 1px solid var(--el-border-color);
    border-left: 0;
  }

  .evidence-strip > div:nth-child(4) {
    border-top: 1px solid var(--el-border-color);
  }
}

@media (max-width: 600px) {
  .about-page {
    gap: 14px;
  }

  .hero-card :deep(.el-card__body) {
    padding: 22px 18px;
  }

  .hero-copy h1 {
    margin-top: 18px;
    font-size: 30px;
  }

  .hero-copy > p {
    font-size: 14px;
  }

  .module-grid,
  .highlight-list {
    grid-template-columns: 1fr;
  }

  .evidence-strip > div {
    flex-direction: column;
    gap: 3px;
    align-items: center;
    padding: 14px 8px;
  }

  .source-card :deep(.el-card__body) {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .about-page * {
    scroll-behavior: auto;
  }
}
</style>
