<script setup lang="ts">
import SvgIcon from '@/components/custom/svg-icon.vue';

interface Props {
  title: string;
  value: number;
  icon?: string;
  color?: string;
  fontSize?: number;
}

defineProps<Props>();

const formatValue = (val: number) => {
  if (val >= 1000000) {
    return `${(val / 1000000).toFixed(2)}M`;
  }
  if (val >= 1000) {
    return `${(val / 1000).toFixed(2)}K`;
  }
  return val.toString();
};
</script>

<template>
  <ElCard class="statistic-card">
    <div class="card-content">
      <div class="card-icon">
        <SvgIcon :icon="icon" :color="color" :font-size="fontSize"></SvgIcon>
      </div>
      <div class="card-info">
        <div class="card-title">{{ title }}</div>
        <div class="card-value">{{ formatValue(value) }}</div>
        <!-- <p>较昨日<span>{{growthRate(42)}}</span></p> -->
      </div>
    </div>
  </ElCard>
</template>

<style scoped lang="scss">
.statistic-card {
  height: 100%;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }

  :deep(.el-card__body) {
    padding: 16px;
  }

  .card-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .card-icon {
    flex-shrink: 0;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #4000a0 0%, #75beff 100%);
    border-radius: 8px;
    color: white;
    font-size: 24px;

    div {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .card-info {
    flex: 1;
    min-width: 0;
  }

  .card-title {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-value {
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
