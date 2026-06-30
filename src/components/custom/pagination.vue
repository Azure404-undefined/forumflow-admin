<script setup lang="ts">
defineOptions({ name: 'CustomPagination' });

interface Props {
  total: number;
  current: number;
  pageSize: number;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:current', value: number): void;
  (e: 'update:pageSize', value: number): void;
  (e: 'currentChange', value: number): void;
  (e: 'sizeChange', value: number): void;
}

const emit = defineEmits<Emits>();

function onCurrentChange(page: number) {
  emit('update:current', page);
  emit('currentChange', page);
}

function onSizeChange(size: number) {
  emit('update:pageSize', size);
  emit('sizeChange', size);
}
</script>

<template>
  <div class="custom-pagination">
    <ElPagination
      background
      layout="total, prev, pager, next, sizes, jumper"
      :total="props.total"
      :current-page="props.current"
      :page-size="props.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      @current-change="onCurrentChange"
      @size-change="onSizeChange"
    />
  </div>
</template>

<style scoped>
.custom-pagination {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .custom-pagination :deep(.el-pager),
  .custom-pagination :deep(.el-pagination__sizes) {
    display: none;
  }
}
</style>
