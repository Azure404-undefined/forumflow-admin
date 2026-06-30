<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { TreeInstance } from 'element-plus';
import {
  addRole,
  assignRolePermissions,
  deleteRole,
  editRole,
  fetchPermissionTree,
  fetchRoleList,
  fetchRolePermissions
} from '@/service/api/role';
// import CustomPagination from '@/components/custom/pagination.vue';

type Role = Api.Role.RoleInfo;

const searchForm = ref({ id: '', name: '', status: '' as '' | 0 | 1 });
const loading = ref(false);
const dialogLoading = ref(false);
const isEdit = ref(false);
const dialogFormVisible = ref(false);
const batchDialogVisible = ref(false);
const permissionDialogVisible = ref(false);
const submitting = ref(false);
const activeName = ref('0');
const batchForm = ref({ status: 0 as 0 | 1 });
const tableRef = ref();
const treeRef = ref<TreeInstance>();
const form = ref<Api.Role.RoleForm>({
  id: '',
  name: '',
  description: '',
  status: 0
});
const currentRole = ref('');
const checkedPermissionIds = ref<Api.Role.RolePermissions>([]);
const permissionTreeData = ref<Api.Role.PermissionNode[]>([
  {
    id: '', // 权限标识，如 'user:view'
    label: '', // 显示名称，如 '查看用户'
    children: []
  }
]);
// const current = ref(1);
// const pageSize = ref(10);
// const total = ref(0);

const roles = ref<Role[]>([]);
const selectedRows = ref<Role[]>([]);

const clearAllSelection = () => {
  nextTick(() => {
    tableRef.value?.clearSelection();
  });
};

const getRolesList = async () => {
  roles.value = [];
  loading.value = true;
  try {
    const res = await fetchRoleList({
      id: searchForm.value.id,
      name: searchForm.value.name,
      status: searchForm.value.status === '' ? undefined : searchForm.value.status
    });
    roles.value = res.data!;
  } catch {
    ElMessage.error('获取角色列表失败');
  } finally {
    loading.value = false;
    clearAllSelection();
  }
};

function resetForm() {
  form.value = {
    id: '',
    name: '',
    description: '',
    status: 0
  };
}

function resetSearch() {
  searchForm.value = {
    id: '',
    name: '',
    status: ''
  };
}

// 监听分页、每页条数、搜索条件变化
watch(
  () => searchForm,
  () => {
    getRolesList();
  },
  { deep: true }
);

function handleSelectionChange(selection: Role[]) {
  selectedRows.value = selection;
}

function handleSearch() {
  getRolesList();
}

function handleCreate() {
  resetForm();
  isEdit.value = false;
  dialogFormVisible.value = true;
}

function handleEdit(row: Role) {
  isEdit.value = true;
  form.value = { ...row };
  dialogFormVisible.value = true;
}

async function handleDelete(row: Role) {
  const confirm = await ElMessageBox.confirm('确认要删除该角色吗？', '提示', { type: 'warning' })
    .then(() => true)
    .catch(() => false);
  if (!confirm) return;
  loading.value = true;
  try {
    const res = await deleteRole(row.id);
    ElMessage.success(res.response.data.msg);
    await getRolesList();
  } catch {
    ElMessage.error('删除失败');
  } finally {
    loading.value = false;
  }
}

async function handleAssign(row: Role) {
  dialogLoading.value = true;
  permissionTreeData.value = [];
  permissionDialogVisible.value = true;
  currentRole.value = row.id;
  try {
    const res = await fetchPermissionTree();
    const res2 = await fetchRolePermissions(row.id);
    checkedPermissionIds.value = res2.data!;
    permissionTreeData.value = res.data!;
  } catch {
    ElMessage.error('权限树获取失败');
  } finally {
    dialogLoading.value = false;
  }
}

async function handlePermissionSubmit() {
  const checkedKeys = treeRef.value?.getCheckedKeys();
  if (!checkedKeys) {
    ElMessage.warning('请选择一项权限');
    return;
  }
  submitting.value = true;
  try {
    await assignRolePermissions(currentRole.value, checkedKeys as string[]);
    ElMessage.success('权限分配成功');
    permissionDialogVisible.value = false;
    await getRolesList();
  } catch {
    ElMessage.error('权限分配失败');
  } finally {
    submitting.value = false;
    currentRole.value = '';
  }
}

async function saveRole() {
  if (!form.value.id || !form.value.name) {
    ElMessage.warning('请填写角色ID和名称');
    return;
  }
  submitting.value = true;
  try {
    if (isEdit.value) {
      const payload: Api.Role.RoleForm = {
        id: form.value.id,
        name: form.value.name,
        description: form.value.description,
        status: form.value.status
      };
      const res = await editRole(form.value.id, payload);
      ElMessage.success(res.response.data.msg);
    } else {
      const payload: Api.Role.RoleForm = {
        id: form.value.id,
        name: form.value.name,
        description: form.value.description,
        status: form.value.status
      };
      const res = await addRole(payload);
      // console.log(res.response.data.msg)
      ElMessage.success(res.response.data.msg);
    }
    dialogFormVisible.value = false;
    await getRolesList();
  } catch (err: any) {
    ElMessage.error(err.response.data.msg);
  } finally {
    submitting.value = false;
  }
}

// 批量操作
function handleSelectionEdit() {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('请先选择至少一项');
    return;
  }
  const first = selectedRows.value[0];
  let statusValue: 0 | 1 = 0;
  if (typeof first.status === 'number') {
    statusValue = first.status;
  } else {
    statusValue = first.status === '1' ? 1 : 0;
  }
  batchForm.value.status = statusValue;
  batchDialogVisible.value = true;
}

async function batchUpdateStatus() {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('请先选择至少一项');
    return;
  }
  const confirm = await ElMessageBox.confirm('确认要批量修改状态吗？', '提示', { type: 'warning' })
    .then(() => true)
    .catch(() => false);
  if (!confirm) return;
  loading.value = true;
  try {
    const promises = selectedRows.value.map(r => {
      const payload: Api.Role.RoleForm = {
        id: r.id,
        name: r.name,
        description: r.description,
        status: batchForm.value.status
      };
      return editRole(r.id, payload);
    });
    await Promise.all(promises);
    ElMessage.success('批量修改成功');
    batchDialogVisible.value = false;
    await getRolesList();
    clearAllSelection();
  } catch {
    ElMessage.error('批量修改失败');
  } finally {
    loading.value = false;
  }
}

async function batchDeleteRoles() {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('请先选择至少一项');
    return;
  }
  const confirm = await ElMessageBox.confirm('确认要删除选中角色吗？', '提示', { type: 'warning' })
    .then(() => true)
    .catch(() => false);
  if (!confirm) return;
  loading.value = true;
  try {
    const promises = selectedRows.value.map(r => deleteRole(r.id));
    await Promise.all(promises);
    ElMessage.success('批量删除成功');
    batchDialogVisible.value = false;
    await getRolesList();
    clearAllSelection();
  } catch {
    ElMessage.error('批量删除失败');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  getRolesList();
});
</script>

<template>
  <div class="role-page">
    <ElCard class="collapse-search">
      <ElCollapse v-model="activeName" accordion>
        <ElCollapseItem title="搜索选项" name="1" class="search-item">
          <div class="search-bar">
            <ElInput v-model="searchForm.id" placeholder="按角色ID搜索" clearable class="search-input" />
            <ElInput v-model="searchForm.name" placeholder="按名称搜索" clearable class="search-input" />
            <ElSelect v-model="searchForm.status" placeholder="状态" class="status-select">
              <ElOption label="全部" value="" />
              <ElOption label="启用" :value="1" />
              <ElOption label="禁用" :value="0" />
            </ElSelect>
            <ElButton type="primary" @click="handleSearch">查询</ElButton>
            <ElButton @click="resetSearch">重置</ElButton>
          </div>
        </ElCollapseItem>
      </ElCollapse>
    </ElCard>

    <ElCard class="card-wrapper">
      <div class="actions-space">
        <div>角色列表</div>
        <div class="actions-button">
          <ElButton type="primary" @click="handleCreate">新增角色</ElButton>
          <ElButton type="primary" @click="handleSelectionEdit">批量操作</ElButton>
        </div>
      </div>
      <ElTable
        ref="tableRef"
        v-loading="loading"
        :data="roles"
        row-key="id"
        class="role-table"
        @selection-change="handleSelectionChange"
      >
        <ElTableColumn type="selection"></ElTableColumn>
        <ElTableColumn prop="id" label="角色ID" width="120" />
        <ElTableColumn prop="name" label="名称" width="160" />
        <ElTableColumn prop="description" label="描述" />
        <ElTableColumn label="状态" width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'warning'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="createTime" label="创建时间" width="180" />
        <ElTableColumn label="操作" width="260" align="center">
          <template #default="{ row }">
            <ElButton type="primary" plain size="small" @click="handleEdit(row)">编辑</ElButton>
            <ElButton type="danger" plain size="small" @click="handleDelete(row)">删除</ElButton>
            <ElButton type="success" plain size="small" @click="handleAssign(row)">分配权限</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <!--
 <div class="pagination-wrap">
        <CustomPagination
          :total="total"
          :current="current"
          :page-size="pageSize"
          @current-change="onCurrentChange"
          @size-change="onSizeChange"
        />
      </div> 
-->
    </ElCard>
    <ElDialog
      v-model="dialogFormVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="min(500px, 94vw)"
      draggable
      overflow
    >
      <ElForm :model="form">
        <ElFormItem label="角色ID" label-width="80px">
          <ElInput v-model="form.id" autocomplete="off" />
        </ElFormItem>
        <ElFormItem label="名称" label-width="80px">
          <ElInput v-model="form.name" autocomplete="off" />
        </ElFormItem>
        <ElFormItem label="描述" label-width="80px">
          <ElInput v-model="form.description" autocomplete="off" />
        </ElFormItem>
        <ElFormItem label="状态" label-width="80px">
          <ElRadioGroup v-model="form.status">
            <ElRadio :value="0" size="large">禁用</ElRadio>
            <ElRadio :value="1" size="large">启用</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="dialogFormVisible = false">取消</ElButton>
          <ElButton type="primary" :loading="submitting" @click="saveRole">保存</ElButton>
        </div>
      </template>
    </ElDialog>

    <ElDialog v-model="batchDialogVisible" title="批量操作" width="min(500px, 94vw)" draggable overflow>
      <div>已选中 {{ selectedRows.length }} 项</div>
      <ElForm :model="batchForm">
        <ElFormItem label="状态" label-width="80px">
          <ElRadioGroup v-model="batchForm.status">
            <ElRadio :value="0">禁用</ElRadio>
            <ElRadio :value="1">启用</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="batchDialogVisible = false">取消</ElButton>
          <ElButton type="danger" @click="batchDeleteRoles">删除选中</ElButton>
          <ElButton type="primary" @click="batchUpdateStatus">应用修改</ElButton>
        </div>
      </template>
    </ElDialog>

    <ElDialog v-model="permissionDialogVisible" title="分配权限" width="min(500px, 94vw)" draggable overflow>
      <ElTree
        ref="treeRef"
        v-loading="dialogLoading"
        :data="permissionTreeData"
        show-checkbox
        node-key="id"
        default-expand-all
        :default-checked-keys="checkedPermissionIds"
        :expand-on-click-node="true"
        :props="{ label: 'label', children: 'children' }"
      />
      <template #footer>
        <ElButton @click="permissionDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handlePermissionSubmit">确认</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped lang="scss">
.role-page {
  .collapse-search {
    margin-bottom: 10px;
    border-radius: 8px;
    .search-item {
      box-sizing: border-box;
      border-radius: 8px;
      .search-bar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;

        .search-input {
          width: 220px;
        }

        .status-select {
          width: 140px;
        }
      }
    }
  }

  .card-wrapper {
    padding: 12px;
    .actions-space {
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
    }
  }

  .role-table {
    width: 100%;
  }
}
</style>
