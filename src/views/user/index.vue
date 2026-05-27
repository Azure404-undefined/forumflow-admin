<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElForm, ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { formStatusOPtions } from '@/constants/business';
import {
  addUser,
  assignUserRoles,
  deleteUser,
  editUser,
  fetchUserList,
  resetUserPwd,
  updateUserStatus
} from '@/service/api/user';
import CustomPagination from '@/components/custom/pagination.vue';

type UserInfo = Api.User.UserInfo;
type UserForm = Api.User.UserForm;

const searchForm = reactive({ username: '', nickname: '', phone: '', status: '' as '' | 0 | 1 });
const current = ref(1);
const pageSize = ref(10);
const total = ref(0);
const regPhone = /^1[3-9]\d{9}$/;
const regPassword = /^\w{6,18}$/;
const loading = ref(false);
const isOpen = ref(false);
const isEdit = ref(false);
const tableRef = ref();
const formRef = ref<FormInstance | null>(null);
const isBatchOpen = ref(false);
const batchFormRef = ref<FormInstance | null>(null);
const userRoles = ['super', 'admin', 'moderator', 'user'];
const form = ref<UserForm & { id: string }>({
  id: '',
  username: '',
  nickname: '',
  email: '',
  phone: '',
  status: 0,
  password: '',
  roles: []
});
const validatePhone = (_rules: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请输入手机号'));
  } else if (!regPhone.test(value)) {
    callback(new Error('请输入正确的手机号'));
  } else {
    callback();
  }
};
const validatePassword = (_rules: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('密码不能为空'));
  } else if (!regPassword.test(value)) {
    callback(new Error('密码需包含下划线，数字，大小写字母,长度需6到18位之间'));
  } else {
    callback();
  }
};
const formRules = ref<FormRules<UserForm>>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 1, max: 6, message: '长度需小于7位', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 1, max: 6, message: '长度需小于7位', trigger: 'blur' }
  ],
  email: [{ type: 'email', required: true, message: '请输入邮箱', trigger: 'blur' }],
  phone: [{ required: true, validator: validatePhone, trigger: 'blur' }],
  password: isEdit.value
    ? [
        { required: false, validator: validatePassword, trigger: 'blur' },
        { min: 6, max: 18, message: '长度需6到18位之间', trigger: 'blur' }
      ]
    : [
        { required: true, validator: validatePassword, trigger: 'blur' },
        { min: 6, max: 18, message: '长度需6到18位之间', trigger: 'blur' }
      ],
  status: [{ required: true, message: '是否启用？', trigger: 'change' }],
  roles: [{ required: true, message: '请选择至少一个角色', trigger: 'blur' }]
});

const users = ref<UserInfo[]>([]);
const selectedRows = ref<UserInfo[]>([]);

const batchForm = ref({
  password: '',
  roles: [] as string[],
  status: 0 as 0 | 1
});

const handleSelectionChange = (selection: UserInfo[]) => {
  selectedRows.value = selection;
};

const clearAllSelection = () => {
  nextTick(() => {
    tableRef.value?.clearSelection();
  });
};

const getUserList = async () => {
  users.value = [];
  loading.value = true;
  try {
    const res = await fetchUserList({
      pageNum: current.value,
      pageSize: pageSize.value,
      username: searchForm.username || undefined,
      nickname: searchForm.nickname || undefined,
      phone: searchForm.phone || undefined,
      status: searchForm.status === '' ? undefined : searchForm.status
    });
    users.value = res.data!.list;
    total.value = res.data!.total;
    pageSize.value = res.data!.pageSize;
  } catch {
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
    clearAllSelection();
  }
};

// 监听分页、搜索条件变化（pageSize 单独监听以重置页码）
watch(
  [current, () => searchForm],
  () => {
    getUserList();
  },
  { deep: true }
);

// 当每页条数改变时重置到第一页（current = 1），由 current 的 watcher 触发列表刷新
watch(pageSize, () => {
  current.value = 1;
});

function resetSearch() {
  searchForm.username = '';
  searchForm.nickname = '';
  searchForm.phone = '';
  searchForm.status = '';
  current.value = 1;
}

// 表单验证辅助
const validate = async () => {
  await formRef.value?.validate();
};

function resetForm() {
  form.value = {
    id: '',
    username: '',
    nickname: '',
    email: '',
    phone: '',
    status: 0,
    password: '',
    roles: []
  };
}

// 增删改
async function onSubmit() {
  // 新建/编辑保存
  if (isEdit.value) {
    validate()
      .then(async () => await editUser(form.value.id, form.value))
      .then(value => {
        ElMessage.success(value.response.data.msg);
        getUserList();
        current.value = 1;
        isOpen.value = false;
      });
  } else {
    validate()
      .then(async () => await addUser(form.value))
      .then(value => {
        ElMessage.success(value.response.data.msg);
        getUserList();
        current.value = 1;
        isOpen.value = false;
      });
  }
}

function handleCreate() {
  resetForm();
  isEdit.value = false;
  isOpen.value = true;
}

function handleEdit(row: UserForm & { id: string }) {
  isEdit.value = true;
  form.value = { ...row };
  if (typeof form.value.status === 'string') {
    form.value.status = Number(form.value.status) as any;
  }
  isOpen.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
}

async function handleDelete(row: UserInfo) {
  const res = await deleteUser(row.id);
  // console.log(res.response.data.msg)
  ElMessage.success(res.response.data.msg);
  getUserList();
}

// 批量操作
function handleSelectedRowsEdit() {
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
  batchForm.value = {
    password: '',
    roles: first.roles ? [...first.roles] : [],
    status: statusValue
  };
  isBatchOpen.value = true;
}

async function batchApply() {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('请先选择至少一项');
    return;
  }
  const applyRoles = batchForm.value.roles;
  const applyStatus = batchForm.value.status;
  const promises = selectedRows.value.map(u =>
    Promise.all([assignUserRoles(u.id, { roleIds: applyRoles }), updateUserStatus(u.id, { status: applyStatus })])
  );
  try {
    await Promise.all(promises);
    ElMessage.success('批量更新成功');
    isBatchOpen.value = false;
    getUserList();
    clearAllSelection();
  } catch {
    ElMessage.error('批量更新失败');
  }
}

async function batchResetPassword() {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('请先选择至少一项');
    return;
  }
  if (!regPassword.test(batchForm.value.password)) {
    ElMessage.warning('密码需为下划线，数字，大小写字母，长度6-18位');
    return;
  }
  if (
    !(await ElMessageBox.confirm('确定要重置选中用户的密码吗？')
      .then(() => true)
      .catch(() => false))
  )
    return;
  try {
    const promises = selectedRows.value.map(u => resetUserPwd(u.id, { newPassword: batchForm.value.password }));
    await Promise.all(promises);
    ElMessage.success('密码重置成功');
    isBatchOpen.value = false;
    getUserList();
    clearAllSelection();
  } catch {
    ElMessage.error('密码重置失败');
  }
}

async function batchDelete() {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('请先选择至少一项');
    return;
  }
  try {
    await ElMessageBox.confirm('确定要删除选中用户吗？', '提示', { type: 'warning' });
    const promises = selectedRows.value.map(u => deleteUser(u.id));
    await Promise.all(promises);
    ElMessage.success('删除成功');
    isBatchOpen.value = false;
    getUserList();
    clearAllSelection();
  } catch {
    ElMessage.error('删除失败');
  }
}

onMounted(() => {
  getUserList();
});
</script>

<template>
  <div class="user-list-page">
    <div class="search-bar">
      <ElInput v-model="searchForm.username" placeholder="按用户名搜索" clearable class="search-input" />
      <ElInput v-model="searchForm.nickname" placeholder="按昵称搜索" clearable class="search-input" />
      <ElInput v-model="searchForm.phone" placeholder="按电话号码搜索" clearable class="search-input" />
      <ElSelect v-model="searchForm.status" placeholder="状态" class="status-select">
        <ElOption label="全部" value="" />
        <ElOption label="启用" :value="1" />
        <ElOption label="禁用" :value="0" />
      </ElSelect>
      <ElButton type="primary" :loading="loading" @click="getUserList">刷新</ElButton>
      <ElButton @click="resetSearch">重置</ElButton>
      <div class="actions-space"></div>
      <ElButton type="primary" @click="handleCreate()">新增用户</ElButton>
      <ElButton type="primary" @click="handleSelectedRowsEdit">批量操作</ElButton>
    </div>

    <ElCard class="card-wrapper">
      <ElTable
        ref="tableRef"
        v-loading="loading"
        :data="users"
        :row-key="row => row.id"
        height="450"
        element-loading-background="rgba(200, 200, 200, 0.8)"
        class="user-table"
        @selection-change="handleSelectionChange"
      >
        <ElTableColumn type="selection" fixed :reserve-selection="true" width="50"></ElTableColumn>
        <ElTableColumn prop="id" label="ID" fixed width="80" />
        <ElTableColumn prop="username" label="用户名" width="100" />
        <ElTableColumn prop="nickname" label="昵称" width="100" />
        <ElTableColumn prop="email" label="邮箱" />
        <ElTableColumn prop="phone" label="手机" width="180" />
        <ElTableColumn prop="roles" label="角色" width="180" />
        <ElTableColumn prop="createTime" label="创建时间" sortable width="180" />
        <ElTableColumn label="状态" width="100" align="center">
          <template #default="scoped">
            <ElTag :type="scoped.row.status === 1 ? 'success' : 'warning'">
              {{ scoped.row.status === 1 ? '启用' : '禁用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="160" align="center">
          <template #default="scoped">
            <ElButton type="primary" plain size="small" @click="handleEdit(scoped.row)">编辑</ElButton>
            <ElPopconfirm title="确认删除？" @confirm="() => handleDelete(scoped.row)">
              <template #reference>
                <ElButton type="danger" plain size="small">删除</ElButton>
              </template>
            </ElPopconfirm>
          </template>
        </ElTableColumn>
      </ElTable>
      <div class="pagination-wrap">
        <CustomPagination v-model:current="current" v-model:page-size="pageSize" :total="total" />
      </div>
    </ElCard>
    <div
      class="drawerMask"
      :class="{ show: isOpen }"
      @click="
        () => {
          isOpen = false;
        }
      "
    ></div>
    <ElForm
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="auto"
      label-position="top"
      class="drawer"
      :class="{ show: isOpen }"
    >
      <div class="drawerTitle">
        <div>{{ isEdit ? '编辑用户' : '新增用户' }}</div>
        <div></div>
      </div>
      <ElFormItem label="用户名" prop="username">
        <ElInput v-model="form.username" />
      </ElFormItem>
      <ElFormItem label="昵称" prop="nickname">
        <ElInput v-model="form.nickname" />
      </ElFormItem>
      <ElFormItem label="密码" prop="password">
        <ElInput v-model="form.password" type="password" />
      </ElFormItem>
      <ElFormItem label="邮箱" prop="email">
        <ElInput v-model="form.email" />
      </ElFormItem>
      <ElFormItem label="手机" prop="phone">
        <ElInput v-model="form.phone" />
      </ElFormItem>
      <ElFormItem label="用户角色" prop="roles">
        <ElSelect v-model="form.roles" placeholder="please select" multiple>
          <ElOption v-for="item in userRoles" :key="item" :label="item" :value="item" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="状态" prop="status">
        <ElRadioGroup v-model="form.status">
          <ElRadio
            v-for="item in formStatusOPtions"
            :key="item.value"
            :value="item.value"
            :label="$t(item.label)"
            border
          ></ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem class="drawerFooter">
        <ElButton type="primary" @click="onSubmit()">保存</ElButton>
        <ElButton
          @click="
            () => {
              isOpen = false;
            }
          "
        >
          取消
        </ElButton>
      </ElFormItem>
    </ElForm>

    <div
      class="drawerMask"
      :class="{ show: isBatchOpen }"
      @click="
        () => {
          isBatchOpen = false;
        }
      "
    ></div>
    <ElForm
      ref="batchFormRef"
      :model="batchForm"
      label-width="auto"
      label-position="top"
      class="drawer"
      :class="{ show: isBatchOpen }"
    >
      <div class="drawerTitle">
        <div>批量操作</div>
        <div>已选中 {{ selectedRows.length }} 项</div>
      </div>
      <ElFormItem label="重置密码">
        <ElInput v-model="batchForm.password" type="password" placeholder="用于重置密码" />
      </ElFormItem>
      <ElFormItem label="用户角色">
        <ElSelect v-model="batchForm.roles" placeholder="请选择角色" multiple>
          <ElOption v-for="item in userRoles" :key="item" :label="item" :value="item" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="状态">
        <ElRadioGroup v-model="batchForm.status">
          <ElRadio
            v-for="item in formStatusOPtions"
            :key="item.value"
            :value="item.value"
            :label="$t(item.label)"
            border
          ></ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem class="drawerFooter">
        <ElButton type="primary" @click="batchApply">应用修改</ElButton>
        <ElButton type="primary" @click="batchResetPassword">重置密码</ElButton>
        <ElPopconfirm title="确认删除？" @confirm="batchDelete">
          <template #reference>
            <ElButton type="danger">删除</ElButton>
          </template>
        </ElPopconfirm>
        <ElButton
          @click="
            () => {
              isBatchOpen = false;
            }
          "
        >
          取消
        </ElButton>
      </ElFormItem>
    </ElForm>
  </div>
</template>

<style scoped lang="scss">
.user-list-page {
  .search-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;

    .search-input {
      width: 200px;
    }

    .status-select {
      width: 120px;
    }

    .actions-space {
      flex: 1 1 auto;
    }
  }

  .card-wrapper {
    padding: 12px;
  }

  .user-table {
    width: 100%;
  }

  .el-tag {
    &.is-success {
      background-color: #f0fff4 !important;
      color: #2f855a !important;
      border: none !important;
    }

    &.is-danger {
      background-color: #fff5f5 !important;
      color: #c53030 !important;
      border: none !important;
    }
  }

  .pagination-wrap {
    padding-top: 1vw;
    // position: absolute;
    display: flex;
    justify-content: flex-end;
  }

  .drawerMask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.3s;
    z-index: 1000;
  }

  .drawerMask.show {
    opacity: 1;
    visibility: visible;
  }

  .drawer {
    overflow-y: auto;
    padding: 1vw;
    width: 350px;
    height: 100%;
    background-color: #ffffff;
    border: 1px solid #c8c8c8;
    border-radius: 8px;
    box-shadow: 10px 10px 30px #c8c8c8;
    transition: transform 0.3s ease-in-out;
    left: 100%;
    top: 0;
    z-index: 1001;
    position: fixed;
    transform: translateX(0);
  }

  .drawer.show {
    transform: translateX(-350px);
  }

  .drawerTitle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 4vw;
    margin-bottom: 2vw;
  }

  .drawerTitle div {
    // font: normal 600 20px;
    font-size: 16px;
    color: #626262;
  }

  .drawerFooter {
    position: absolute;
    bottom: 2%;
  }
}
</style>
