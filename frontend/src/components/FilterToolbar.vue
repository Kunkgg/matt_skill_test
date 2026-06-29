<template>
  <div class="filter-toolbar">
    <!-- Row 1: Filter dropdowns -->
    <div class="filter-toolbar__filters">
      <div v-for="item in selectItems" :key="item.field" class="filter-toolbar__field">
        <label class="filter-toolbar__label">{{ item.label }}</label>
        <el-select
          :model-value="modelValue[item.field]"
          :placeholder="item.label"
          clearable
          filterable
          size="default"
          class="filter-toolbar__select"
          @update:model-value="handleChange(item.field, $event)"
        >
          <el-option label="全部" value="" />
          <el-option
            v-for="opt in (filterOptions[item.optionsKey] || [])"
            :key="opt"
            :label="opt"
            :value="opt"
          />
        </el-select>
      </div>

      <div class="filter-toolbar__field filter-toolbar__field--status">
        <label class="filter-toolbar__label">任务状态</label>
        <el-select
          :model-value="modelValue.task_status"
          placeholder="任务状态"
          multiple
          collapse-tags
          collapse-tags-tooltip
          size="default"
          class="filter-toolbar__select"
          @update:model-value="handleChange('task_status', $event)"
        >
          <el-option
            v-for="opt in taskStatusOptions"
            :key="opt"
            :label="opt"
            :value="opt"
          />
        </el-select>
      </div>
    </div>

    <!-- Row 2: Action buttons -->
    <div class="filter-toolbar__actions">
      <div class="filter-toolbar__actions-left">
        <el-button
          :icon="Refresh"
          size="default"
          @click="handleReset"
        >
          重置
        </el-button>
        <el-button
          :icon="RefreshRight"
          size="default"
          type="primary"
          @click="emit('refresh')"
        >
          刷新
        </el-button>
      </div>
      <div class="filter-toolbar__actions-right">
        <el-button
          :icon="Guide"
          size="default"
          text
          @click="emit('navigate', 'guide')"
        >
          缺失文件处理指南
        </el-button>
        <el-button
          :icon="Lock"
          size="default"
          text
          @click="emit('navigate', 'shield')"
        >
          屏蔽配置
        </el-button>
        <el-button
          :icon="MapLocation"
          size="default"
          text
          @click="emit('navigate', 'remap')"
        >
          路径映射配置
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Refresh, RefreshRight, Guide, Lock, MapLocation } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  filterOptions: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'refresh', 'navigate'])

const selectItems = [
  { label: '组件版本', field: 'search_version', optionsKey: 'versions' },
  { label: '组件组', field: 'group_name', optionsKey: 'group_names' },
  { label: '产品', field: 'product', optionsKey: 'products' },
  { label: '代码类型', field: 'source_type', optionsKey: 'source_types' },
  { label: '编程语言', field: 'lan', optionsKey: 'lans' },
  { label: '数据类型', field: 'data_type', optionsKey: 'data_types' },
  { label: '扫描工具', field: 'tool_name', optionsKey: 'tool_names' },
]

const taskStatusOptions = ['通过', '缺失', '超期', '未扫描']

function handleChange(field, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value ?? (field === 'task_status' ? [...taskStatusOptions] : ''),
  })
}

const defaultFilters = {
  search_version: '',
  group_name: '',
  product: '',
  source_type: '',
  lan: '',
  data_type: '',
  tool_name: '',
  task_status: ['通过', '缺失', '超期', '未扫描'],
}

function handleReset() {
  emit('update:modelValue', { ...defaultFilters })
}
</script>

<style scoped>
.filter-toolbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 16px 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.filter-toolbar__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px 12px;
}

.filter-toolbar__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 130px;
  flex: 1;
  max-width: 180px;
}

.filter-toolbar__field--status {
  min-width: 180px;
  max-width: 220px;
}

.filter-toolbar__label {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-toolbar__select {
  width: 100%;
}

.filter-toolbar__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
}

.filter-toolbar__actions-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-toolbar__actions-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-toolbar__actions-right .el-button {
  color: var(--color-muted-foreground);
  font-weight: 500;
}

.filter-toolbar__actions-right .el-button:hover {
  color: var(--color-primary);
}
</style>
