<script setup lang="ts">
/*
  板块管理组件（PostForums）

  功能概述：
  - 显示可拖拽排序的板块树
  - 支持新增/编辑/删除板块（含父子关系、排序）
  - 支持上传并预览 SVG 图标
  - 与后端 API 交互：fetchForumTree / addForum / editForum / deleteForum / moveForum

  实现方式：
  - 使用 Vue 3 `<script setup>` + Composition API
  - 使用 Element Plus 组件（ElTree、ElForm、ElUpload 等）
*/

import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules, TreeInstance, UploadFile } from 'element-plus';
import { addForum, deleteForum, editForum, fetchForumTree, moveForum } from '@/service/api/forums';

defineOptions({ name: 'PostForums' });

/**
 * 类型定义（项目中全局 API 类型在 `Api.Forum` 命名空间）
 */
type ForumInfo = Api.Forum.ForumInfo;
/**
 * 表单模型：去掉后端原始 `svgIcon` 与 `parentId` 的某些字段，
 * 并在本地维护 `iconFile`（用于上传）和 string 类型的 `parentId`
 */
type ForumFormModel = Omit<Api.Forum.ForumForm, 'svgIcon' | 'parentId'> & {
  parentId: string;
  iconFile?: File | null;
};

/**
 * 扁平化板块项：在递归展开时带上层级信息（level）方便构建父级下拉
 */
type ForumFlatItem = ForumInfo & {
  level: number;
};

/**
 * 树节点拖拽类型：插入前 / 插入后 / 嵌入子节点
 */
type TreeDropType = 'before' | 'after' | 'inner';

interface TreeDropNode {
  data: unknown;
}

interface ParentOption {
  id: string;
  name: string;
  level: number;
  disabled: boolean; // 是否在父级下拉中禁用（避免成为自身或子级的父级）
}

// ElTree 的 props 配置：children 字段名与显示标签字段
const treeProps = {
  children: 'children',
  label: 'name'
};

// refs -> 表单实例、树实例
const formRef = ref<FormInstance | null>(null);
const treeRef = ref<TreeInstance>();

// 树数据与当前选中项
const forumTree = ref<ForumInfo[]>([]);
const currentForum = ref<ForumInfo | null>(null);

// UI 与交互状态
const searchKeyword = ref('');
const activeTab = ref('base');
const loading = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const iconPreview = ref(''); // 本地图标预览 URL（blob:）或后端 svg 字符串 URL

// 编辑/新增表单模型的响应式状态
const form = reactive<ForumFormModel>({
  id: '',
  name: '',
  description: '',
  parentId: '',
  sort: 1,
  status: 1,
  iconFile: null
});

// 表单校验规则
const formRules: FormRules<ForumFormModel> = {
  name: [
    { required: true, message: '请输入板块名称', trigger: 'blur' },
    { max: 30, message: '板块名称不能超过 30 个字符', trigger: 'blur' }
  ],
  sort: [{ required: true, message: '请输入排序值', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  description: [{ max: 500, message: '板块描述不能超过 500 个字符', trigger: 'blur' }]
};

/**
 * 计算属性：扁平化板块列表（用于统计、父级下拉等）
 */
const flatForums = computed<ForumFlatItem[]>(() => flattenForums(forumTree.value));
const isEditing = computed(() => Boolean(form.id));
const activeCount = computed(() => flatForums.value.filter(item => item.status === 1).length);

/**
 * 当正在编辑且表单 id 与当前选中项一致时显示选中项元信息（创建/更新时间等）
 */
const selectedMeta = computed(() => {
  if (!form.id || currentForum.value?.id !== form.id) return null;

  return currentForum.value;
});

/**
 * 父级下拉选项：扁平化后根据层级缩进，并在编辑模式下禁止选择自身或子代作为父级
 */
const parentOptions = computed<ParentOption[]>(() =>
  flatForums.value.map(item => ({
    id: item.id,
    name: item.name,
    level: item.level,
    disabled: isEditing.value ? item.id === form.id || isDescendantOf(item.id, form.id || '') : false
  }))
);

/**
 * 将父级 id 规范成 null 或 string（后端需要 null 表示顶级）
 */
function normalizeParentId(parentId?: string | null) {
  return parentId || null;
}

/**
 * 判断是否是普通对象（用于防御性解析后端数据）
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object');
}

/**
 * 将任意值转换为字符串，空值返回 fallback
 */
function toStringValue(value: unknown, fallback = '') {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;

  return String(value);
}

/**
 * 将任意值转换为数字，失败时返回 fallback
 */
function toNumberValue(value: unknown, fallback = 0) {
  const result = Number(value);

  return Number.isFinite(result) ? result : fallback;
}

/**
 * 规范化后端返回的树形数据为本地 `ForumInfo[]` 结构，保证字段完整性并递归解析 children
 * - 容错：跳过无 id 的节点或非对象节点
 */
function normalizeForumTree(list: unknown, parentId: string | null = null): ForumInfo[] {
  if (!Array.isArray(list)) return [];

  return list.flatMap(item => {
    if (!isRecord(item)) return [];

    const id = toStringValue(item.id);
    if (!id) return [];

    const children = normalizeForumTree(item.children, id);

    return [
      {
        id,
        name: toStringValue(item.name, '未命名板块'),
        description: toStringValue(item.description),
        parentId: parentId || normalizeParentId(toStringValue(item.parentId)),
        sort: toNumberValue(item.sort, 1),
        status: toNumberValue(item.status, 1) === 0 ? 0 : 1,
        createTime: toStringValue(item.createTime),
        createUser: toStringValue(item.createUser),
        updateTime: toStringValue(item.updateTime),
        updateUser: toStringValue(item.updateUser),
        postCount: toNumberValue(item.postCount),
        svgIcon: toStringValue(item.svgIcon),
        children: children.length ? children : undefined
      }
    ];
  });
}

/**
 * 将树形结构扁平化，附带层级信息（用于父级选择与统计）
 */
function flattenForums(list: ForumInfo[], level = 0, result: ForumFlatItem[] = []) {
  list.forEach(item => {
    result.push({ ...item, level });
    if (item.children?.length) {
      flattenForums(item.children, level + 1, result);
    }
  });

  return result;
}

/**
 * 根据 id 查找板块（在树中递归查找）
 */
function findForumById(id: string, list: ForumInfo[] = forumTree.value): ForumInfo | null {
  for (const item of list) {
    if (item.id === id) return item;

    const child = findForumById(id, item.children || []);
    if (child) return child;
  }

  return null;
}

/**
 * 获取树中第一个板块（常用于首次选中）
 */
function findFirstForum(list: ForumInfo[] = forumTree.value): ForumInfo | null {
  return list[0] || null;
}

/**
 * 判断 targetId 是否为 parentId 的子代（用于避免循环父级选择）
 */
function isDescendantOf(targetId: string, parentId: string) {
  const parent = findForumById(parentId);
  if (!parent?.children?.length) return false;

  return Boolean(findForumById(targetId, parent.children));
}

/**
 * 获取同级（兄弟）节点的扁平列表，并按 sort 排序
 */
function getSiblingList(parentId: string | null) {
  return flatForums.value.filter(item => normalizeParentId(item.parentId) === parentId).sort((a, b) => a.sort - b.sort);
}

/**
 * 获取下一个可用的排序值（默认为同级数量 + 1）
 */
function getNextSort(parentId: string | null) {
  const siblings = getSiblingList(parentId);

  return siblings.length + 1;
}

/**
 * 将选中的板块数据同步到表单（用于编辑）
 */
function syncFormByForum(forum: ForumInfo) {
  form.id = forum.id;
  form.name = forum.name;
  form.description = forum.description || '';
  form.parentId = forum.parentId || '';
  form.sort = forum.sort;
  form.status = forum.status;
  form.iconFile = null;
  iconPreview.value = forum.svgIcon || '';

  // 清理表单校验状态（在 DOM 更新后）
  nextTick(() => {
    formRef.value?.clearValidate();
  });
}

/**
 * 重置表单为新增状态，支持传入默认父级（parentId）
 */
function syncCreateForm(parentId: string | null) {
  form.id = '';
  form.name = '';
  form.description = '';
  form.parentId = parentId || '';
  form.sort = getNextSort(parentId);
  form.status = 1;
  form.iconFile = null;
  revokeIconPreview();
  iconPreview.value = '';

  nextTick(() => {
    formRef.value?.clearValidate();
  });
}

/**
 * 选中某个板块并同步表单；若 targetId 不存在则选中第一项或进入新增态
 */
function selectForum(targetId?: string) {
  const target = targetId ? findForumById(targetId) : findFirstForum();

  if (!target) {
    currentForum.value = null;
    syncCreateForm(null);
    return;
  }

  currentForum.value = target;
  syncFormByForum(target);

  nextTick(() => {
    treeRef.value?.setCurrentKey(target.id);
  });
}

/**
 * 从后端拉取板块树并做本地规范化与选中处理
 */
async function getForumTree(targetId = currentForum.value?.id) {
  loading.value = true;

  try {
    const res = await fetchForumTree();
    forumTree.value = normalizeForumTree(res.data);
    selectForum(targetId);
  } catch {
    ElMessage.error('获取板块树失败');
  } finally {
    loading.value = false;
  }
}

/**
 * ElTree 的节点过滤函数（用于搜索）
 */
function filterNode(keyword: string, data: Record<string, unknown>) {
  if (!keyword) return true;

  const name = typeof data.name === 'string' ? data.name : '';

  return name.toLowerCase().includes(keyword.toLowerCase());
}

//  点击树节点 -> 选中并同步表单
function handleNodeClick(data: ForumInfo) {
  currentForum.value = data;
  syncFormByForum(data);
}

// 新增根节点（切换到新增态，父级为空）
function handleCreateRoot() {
  currentForum.value = null;
  syncCreateForm(null);
  treeRef.value?.setCurrentKey();
}

// 新增子节点（以当前选中板块为父）
function handleCreateChild() {
  const parent = currentForum.value || (form.id ? findForumById(form.id) : null);
  if (!parent) {
    ElMessage.warning('请先选择一个板块');
    return;
  }

  syncCreateForm(parent.id);
}

// 新增同级节点（以当前选中板块的父级作为父）
function handleCreateSibling() {
  const base = currentForum.value || (form.id ? findForumById(form.id) : null);
  if (!base) {
    ElMessage.warning('请先选择一个板块');
    return;
  }

  syncCreateForm(normalizeParentId(base.parentId));
}

/**
 * 将表单构造成 FormData，适配后端接受文件上传的接口
 */
function buildFormData() {
  const payload = new FormData();
  payload.append('name', form.name.trim());
  payload.append('description', form.description?.trim() || '');
  payload.append('parentId', form.parentId || '');
  payload.append('sort', String(form.sort));
  payload.append('status', String(form.status));

  if (form.iconFile) {
    payload.append('svgIcon', form.iconFile);
  }

  return payload;
}

/**
 * 提交表单（新增或编辑）
 * - 校验表单
 * - 防止将父级设置为自身或子代
 * - 调用对应后端 API 并刷新树
 */
async function submitForum() {
  await formRef.value?.validate();

  if (form.id && form.parentId && isDescendantOf(form.parentId, form.id)) {
    ElMessage.warning('父级板块不能选择当前板块或其子板块');
    return;
  }

  submitting.value = true;

  try {
    if (isEditing.value && form.id) {
      await editForum(form.id, buildFormData());
      ElMessage.success('保存成功');
      await getForumTree(form.id);
    } else {
      const res = await addForum(buildFormData());
      ElMessage.success('新增成功');
      // 新增后尝试选中新建节点或父级
      await getForumTree(res.data?.id || normalizeParentId(form.parentId) || undefined);
    }
  } catch {
    ElMessage.error('保存失败');
  } finally {
    submitting.value = false;
  }
}

/**
 * 删除当前选中或表单所指定的板块
 * - 会弹出二次确认，删除会级联子节点（后端实现）
 */
async function handleDeleteForum() {
  const forumId = form.id || currentForum.value?.id;
  if (!forumId) {
    ElMessage.warning('请先选择要删除的板块');
    return;
  }

  const confirmed = await ElMessageBox.confirm('删除该板块会同时删除子板块，确定继续吗？', '提示', {
    type: 'warning'
  })
    .then(() => true)
    .catch(() => false);

  if (!confirmed) return;

  deleting.value = true;

  try {
    await deleteForum(forumId);
    ElMessage.success('删除成功');
    currentForum.value = null;
    await getForumTree();
  } catch {
    ElMessage.error('删除失败');
  } finally {
    deleting.value = false;
  }
}

/**
 * 回收本地生成的 blob URL，避免内存泄漏
 */
function revokeIconPreview() {
  if (iconPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(iconPreview.value);
  }
}

/**
 * 处理上传文件变化（由 ElUpload 回调）
 * - 仅允许 SVG 类型
 * - 使用 createObjectURL 做预览（并自动 revoke 上一次的预览）
 */
function handleIconChange(uploadFile: UploadFile) {
  const raw = uploadFile.raw;
  if (!raw) return;

  const isSvg = raw.type === 'image/svg+xml' || raw.name.toLowerCase().endsWith('.svg');
  if (!isSvg) {
    ElMessage.warning('请选择 SVG 图标文件');
    return;
  }

  revokeIconPreview();
  form.iconFile = raw;
  iconPreview.value = URL.createObjectURL(raw);
}

/**
 * 解析拖拽后的目标排序位置
 * - inner: 变为目标节点的最后一个子项
 * - before/after: 在目标父级的序列中计算新的 sort
 */
function resolveDropSort(dropData: ForumInfo, targetParentId: string | null, dropType: TreeDropType) {
  if (dropType === 'inner') {
    return (dropData.children?.length || 0) + 1;
  }

  const siblings = getSiblingList(targetParentId).filter(item => item.id !== dropData.id);
  const dropIndex = siblings.findIndex(item => item.id === dropData.id);
  if (dropIndex === -1) return dropData.sort;

  return dropType === 'before' ? dropIndex + 1 : dropIndex + 2;
}

/**
 * 处理树节点拖拽完成事件：调用后端移动接口并刷新树
 */
async function handleNodeDrop(draggingNode: TreeDropNode, dropNode: TreeDropNode, dropType: TreeDropType) {
  const dragData = draggingNode.data as ForumInfo;
  const dropData = dropNode.data as ForumInfo;
  const targetParentId = dropType === 'inner' ? dropData.id : normalizeParentId(dropData.parentId);

  try {
    await moveForum({
      id: dragData.id,
      targetParentId,
      targetSort: resolveDropSort(dropData, targetParentId, dropType)
    });
    ElMessage.success('板块位置已更新');
    await getForumTree(dragData.id);
  } catch {
    ElMessage.error('移动板块失败');
    await getForumTree(currentForum.value?.id);
  }
}

// 监听搜索关键词，触发树的过滤方法
watchDebounced(
  searchKeyword,
  value => {
    treeRef.value?.filter(value.trim());
  },
  { debounce: 600, maxWait: 1000 }
);

// 生命周期：组件挂载时加载板块树，卸载时回收 blob URL
onMounted(() => {
  getForumTree();
});

onBeforeUnmount(() => {
  revokeIconPreview();
});
</script>

<template>
  <div class="forum-page">
    <div class="forum-layout">
      <ElCard class="tree-panel">
        <template #header>
          <div class="panel-header">
            <ElText class="panel-title">板块管理</ElText>
            <ElText class="page-summary">共 {{ flatForums.length }} 个板块，{{ activeCount }} 个启用</ElText>
            <ElButton type="primary" @click="handleCreateRoot">
              <SvgIcon icon="ic:round-plus" class="mr-4px text-16px" />
              新增根版块
            </ElButton>
          </div>
        </template>

        <ElInput v-model="searchKeyword" placeholder="搜索板块名称" clearable class="tree-search">
          <template #prefix>
            <SvgIcon icon="ic:round-search" class="text-placeholder text-16px" />
          </template>
        </ElInput>

        <ElScrollbar class="tree-scroll">
          <ElTree
            ref="treeRef"
            v-loading="loading"
            :data="forumTree"
            node-key="id"
            draggable
            default-expand-all
            highlight-current
            empty-text="暂无板块"
            :props="treeProps"
            :filter-node-method="filterNode"
            :expand-on-click-node="false"
            @node-click="handleNodeClick"
            @node-drop="handleNodeDrop"
          >
            <template #default="{ data }">
              <div class="forum-node" :class="{ 'is-disabled': data.status === 0 }">
                <div class="node-main">
                  <SvgIcon
                    :icon="
                      data.children?.length ? 'material-symbols:folder-open-outline' : 'material-symbols:folder-outline'
                    "
                    class="node-icon"
                  />
                  <span class="node-name">{{ data.name }}</span>
                </div>
                <div class="node-meta">
                  <span class="post-count">{{ data.postCount || 0 }}</span>
                  <span class="status-pill" :class="data.status === 1 ? 'is-enabled' : 'is-disabled'">
                    <span class="status-dot"></span>
                    {{ data.status === 1 ? '启用' : '禁用' }}
                  </span>
                </div>
              </div>
            </template>
          </ElTree>
        </ElScrollbar>

        <div class="tree-tip">
          <SvgIcon icon="mdi:drag" class="text-16px" />
          <span>拖拽节点可调整排序或移动位置</span>
        </div>
      </ElCard>

      <ElCard class="detail-panel">
        <template #header>
          <div class="panel-header detail-header">
            <div class="page-heading">
              <ElText class="panel-title">板块详情</ElText>
              <ElText class="detail-subtitle">
                {{ isEditing ? currentForum?.name : '新增板块' }}
              </ElText>
            </div>
            <ElTag :type="form.status === 1 ? 'success' : 'warning'" effect="light">
              {{ form.status === 1 ? '启用' : '禁用' }}
            </ElTag>
          </div>
        </template>

        <ElTabs v-model="activeTab" class="detail-tabs">
          <ElTabPane label="基本信息" name="base">
            <ElForm
              ref="formRef"
              :model="form"
              :rules="formRules"
              label-position="top"
              class="forum-form"
              @submit.prevent
            >
              <div class="form-grid">
                <ElFormItem label="板块名称" prop="name">
                  <ElInput v-model="form.name" maxlength="30" placeholder="请输入板块名称" />
                </ElFormItem>

                <ElFormItem label="父级板块" prop="parentId">
                  <ElSelect v-model="form.parentId" placeholder="请选择父级板块" clearable>
                    <ElOption label="顶级板块" value="" />
                    <ElOption
                      v-for="item in parentOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                      :disabled="item.disabled"
                    >
                      <span class="parent-option" :style="{ paddingLeft: `${item.level * 16}px` }">
                        {{ item.name }}
                      </span>
                    </ElOption>
                  </ElSelect>
                </ElFormItem>

                <ElFormItem label="排序" prop="sort">
                  <ElInputNumber
                    v-model="form.sort"
                    :min="1"
                    :max="9999"
                    controls-position="right"
                    class="full-input"
                  />
                </ElFormItem>

                <ElFormItem label="状态" prop="status">
                  <ElRadioGroup v-model="form.status">
                    <ElRadio :value="1">启用</ElRadio>
                    <ElRadio :value="0">禁用</ElRadio>
                  </ElRadioGroup>
                </ElFormItem>
              </div>

              <ElFormItem label="板块图标">
                <div class="icon-picker">
                  <div class="icon-preview">
                    <img v-if="iconPreview" :src="iconPreview" alt="板块图标" />
                    <SvgIcon v-else icon="material-symbols:folder-outline" class="text-24px" />
                  </div>
                  <ElUpload
                    accept=".svg,image/svg+xml"
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="handleIconChange"
                  >
                    <ElButton>选择图标</ElButton>
                  </ElUpload>
                </div>
              </ElFormItem>

              <ElFormItem label="板块描述" prop="description">
                <ElInput
                  v-model="form.description"
                  type="textarea"
                  :rows="5"
                  maxlength="500"
                  show-word-limit
                  placeholder="请输入板块描述"
                />
              </ElFormItem>
            </ElForm>

            <div v-if="selectedMeta" class="meta-grid">
              <div class="meta-item">
                <span>创建时间：</span>
                <strong>{{ selectedMeta.createTime || '-' }}</strong>
              </div>
              <div class="meta-item">
                <span>创建人：</span>
                <strong>{{ selectedMeta.createUser || '-' }}</strong>
              </div>
              <div class="meta-item">
                <span>更新时间：</span>
                <strong>{{ selectedMeta.updateTime || '-' }}</strong>
              </div>
              <div class="meta-item">
                <span>更新人：</span>
                <strong>{{ selectedMeta.updateUser || '-' }}</strong>
              </div>
            </div>
          </ElTabPane>
        </ElTabs>

        <div class="detail-footer">
          <ElButton type="primary" :loading="submitting" @click="submitForum">
            {{ isEditing ? '保存修改' : '新增板块' }}
          </ElButton>
          <ElButton :disabled="!currentForum && !form.id" @click="handleCreateChild">
            <SvgIcon icon="ic:round-plus" class="mr-4px text-16px" />
            新增子版块
          </ElButton>
          <ElButton :disabled="!currentForum && !form.id" @click="handleCreateSibling">
            <SvgIcon icon="ic:round-plus" class="mr-4px text-16px" />
            新增同级版块
          </ElButton>
          <ElButton type="danger" plain :disabled="!isEditing" :loading="deleting" @click="handleDeleteForum">
            <SvgIcon icon="ic:round-delete" class="mr-4px text-16px" />
            删除板块
          </ElButton>
        </div>
      </ElCard>
    </div>
  </div>
</template>

<style scoped lang="scss">
.forum-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  // min-height: 100%;
  .page-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .page-heading {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .page-title {
    color: var(--el-text-color-primary);
    font-size: 18px;
    font-weight: 600;
  }

  .page-summary {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .forum-layout {
    display: grid;
    grid-template-columns: minmax(300px, 38%) minmax(0, 1fr);
    gap: 12px;
    // height: calc(100vh - 192px);
    min-height: 520px;
  }

  .tree-panel,
  .detail-panel {
    min-height: 0;
    overflow: hidden;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
  }
  .tree-panel {
    :deep(.el-card__body) {
      display: flex;
      flex-direction: column;
      height: calc(100% - 57px);
    }
  }

  .detail-panel {
    :deep(.el-card__body) {
      display: flex;
      flex-direction: column;
      height: calc(100% - 57px);
      padding-bottom: 0;
      /* 隐藏横向溢出，避免出现底部水平滚动条；纵向使用内部滚动 */
      overflow-x: hidden;
      overflow-y: auto;
    }
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .panel-title {
    color: var(--el-text-color-primary);
    font-size: 16px;
    font-weight: 600;
  }

  .detail-header {
    align-items: flex-start;
  }

  .detail-subtitle {
    display: block;
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .tree-search {
    margin-bottom: 12px;
  }

  .tree-scroll {
    flex: 1 1 auto;
    min-height: 0;
  }

  :deep(.el-tree) {
    --el-tree-node-hover-bg-color: var(--el-fill-color-light);

    background: transparent;
  }

  :deep(.el-tree-node__content) {
    height: 44px;
    border-radius: 6px;
  }

  :deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }

  .forum-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    min-width: 0;
    padding-right: 8px;
  }

  .node-main {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .node-icon {
    flex: 0 0 auto;
    color: var(--el-color-primary);
    font-size: 18px;
  }

  .node-name {
    overflow: hidden;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .node-meta {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 10px;
  }

  .post-count {
    min-width: 42px;
    padding: 2px 8px;
    color: var(--el-text-color-regular);
    font-size: 12px;
    line-height: 18px;
    text-align: center;
    background-color: var(--el-fill-color);
    border-radius: 999px;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    width: 48px;
    color: var(--el-color-success);
    font-size: 13px;

    &.is-disabled {
      color: var(--el-color-danger);
    }
  }

  .status-dot {
    width: 6px;
    height: 6px;
    background-color: currentcolor;
    border-radius: 50%;
  }

  .tree-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    padding-top: 12px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .detail-tabs {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;

    :deep(.el-tabs__header) {
      margin-bottom: 22px;
    }
  }

  .forum-form {
    min-height: 0;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px 24px;
  }

  .full-input {
    width: 100%;
  }

  .parent-option {
    display: inline-block;
  }

  .icon-picker {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .icon-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    overflow: hidden;
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;

    img {
      width: 28px;
      height: 28px;
      object-fit: contain;
    }
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
    margin-top: 26px;
    padding: 14px 18px;
    background-color: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 8px 0;
    color: var(--el-text-color-secondary);

    strong {
      overflow: hidden;
      color: var(--el-text-color-primary);
      font-weight: 500;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .detail-footer {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin: 16px -20px 0;
    padding: 16px 20px;
    border-top: 1px solid var(--el-border-color-lighter);

    :deep(.el-button) {
      margin-left: 0;
    }
  }
}

@media (max-width: 1100px) {
  .forum-page {
    .forum-layout {
      height: auto;
      grid-template-columns: 1fr;
      min-height: 0;
    }

    .tree-scroll {
      height: 420px;
    }
  }
}

@media (max-width: 720px) {
  .forum-page {
    .page-toolbar,
    .panel-header,
    .detail-footer {
      align-items: stretch;
      flex-direction: column;
    }

    .form-grid,
    .meta-grid {
      grid-template-columns: 1fr;
    }

    .node-meta {
      gap: 6px;
    }

    .post-count {
      min-width: 34px;
      padding: 2px 6px;
    }
  }
}
</style>
