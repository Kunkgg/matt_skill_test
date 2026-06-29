<template>
  <div class="filter-toolbar">
    <div class="filter-toolbar__inner">
      <div class="filter-toolbar__selects">
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
      </div>

      <div class="filter-toolbar__toggles">
        <div class="filter-toolbar__toggle-item">
          <el-switch
            :model-value="modelValue.show_issue_only"
            size="small"
            @update:model-value="handleChange('show_issue_only', $event)"
          />
          <span class="filter-toolbar__toggle-label">只看有缺失</span>
        </div>
        <div class="filter-toolbar__toggle-item">
          <el-switch
            :model-value="modelValue.show_expired_only"
            size="small"
            @update:model-value="handleChange('show_expired_only', $event)"
          />
          <span class="filter-toolbar__toggle-label">只看过期</span>
        </div>
      </div>

      <el-button
        class="filter-toolbar__reset"
        :icon="Refresh"
        size="default"
        @click="handleReset"
      >
        重置
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { Refresh } from '@element-plus/icons-vue'

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

const emit = defineEmits(['update:modelValue'])

const selectItems = [
  { label: '组件版本', field: 'search_version', optionsKey: 'versions' },
  { label: '组件组', field: 'group_name', optionsKey: 'group_names' },
  { label: '产品', field: 'product', optionsKey: 'products' },
  { label: '代码类型', field: 'source_type', optionsKey: 'source_types' },
  { label: '编程语言', field: 'lan', optionsKey: 'lans' },
  { label: '数据类型', field: 'data_type', optionsKey: 'data_types' },
  { label: '扫描工具', field: 'tool_name', optionsKey: 'tool_names' },
]

function handleChange(field, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value ?? '',
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
  show_issue_only: false,
  show_expired_only: false,
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
  border-bottom: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 16px 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.filter-toolbar__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
}

.filter-toolbar__selects {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.filter-toolbar__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
  flex: 1;
  max-width: 180px;
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

.filter-toolbar__toggles {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 2px;
}

.filter-toolbar__toggle-item {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.filter-toolbar__toggle-label {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-card-foreground);
}

.filter-toolbar__reset {
  flex-shrink: 0;
  margin-bottom: 2px;
}
</style>
