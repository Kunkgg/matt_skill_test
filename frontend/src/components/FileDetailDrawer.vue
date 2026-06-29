<template>
  <el-drawer
    :model-value="visible"
    direction="rtl"
    size="50%"
    :destroy-on-close="true"
    class="file-detail-drawer"
    @update:model-value="$emit('update:visible', $event)"
  >
    <template #header>
      <div class="drawer-header">
        <div class="drawer-header__title-row">
          <h3 class="drawer-header__title">
            {{ drawerTitle }}
            <span class="drawer-header__count">· {{ files.length }} 个文件</span>
          </h3>
        </div>
        <div class="drawer-header__sub-info">
          <span>{{ subInfo }}</span>
          <span v-if="context?.sub_group" class="drawer-header__subgroup">
            / {{ context.sub_group }}
          </span>
        </div>
        <div v-if="context?.report_url" class="drawer-header__actions">
          <el-button
            type="primary"
            size="small"
            :icon="Link"
            tag="a"
            :href="context.report_url"
            target="_blank"
            rel="noopener noreferrer"
          >
            查看报告
          </el-button>
        </div>
      </div>
    </template>

    <el-table
      :data="files"
      border
      size="small"
      class="drawer-table"
      :row-class-name="fileRowClassName"
    >
      <el-table-column label="文件路径" prop="file_name" min-width="300">
        <template #default="{ row }">
          <span class="drawer-table__filename">{{ row.file_name }}</span>
        </template>
      </el-table-column>

      <el-table-column label="状态" prop="status" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            :type="statusTagType(row.status, row.is_overdue)"
            size="small"
            effect="light"
          >
            {{ statusLabel(row.status, row.is_overdue) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="归属" prop="sub_group" width="140">
        <template #default="{ row }">
          <span class="drawer-table__subgroup">{{ row.sub_group || '—' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="首次发现" prop="first_detected_time" width="120" align="center">
        <template #default="{ row }">
          <span class="drawer-table__date">{{ formatDate(row.first_detected_time) }}</span>
        </template>
      </el-table-column>
    </el-table>
  </el-drawer>
</template>

<script setup>
import { computed } from 'vue'
import { Link } from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  context: {
    type: Object,
    default: () => ({}),
  },
  files: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['update:visible'])

const statusTypeMap = {
  missing: '缺失',
  failed: '失败',
  overdue_missing: '过期缺失',
  overdue_failed: '过期失败',
}

const drawerTitle = computed(() => {
  const label = statusTypeMap[props.context?.status_type] || '缺失文件'
  return label
})

const subInfo = computed(() => {
  const c = props.context || {}
  const parts = [c.search_version, c.group_name, c.product, c.tool_name].filter(Boolean)
  return parts.join(' / ')
})

function statusTagType(status, isOverdue) {
  if (isOverdue) return 'warning'
  if (status === 'missing') return 'danger'
  if (status === 'failed') return 'warning'
  return 'info'
}

function statusLabel(status, isOverdue) {
  if (isOverdue) return '过期'
  if (status === 'missing') return '缺失'
  if (status === 'failed') return '失败'
  return status || '—'
}

function fileRowClassName({ row }) {
  if (row.is_overdue) return 'drawer-table__row--overdue'
  return ''
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return dateStr
  }
}
</script>

<style scoped>
.drawer-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drawer-header__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.drawer-header__title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-foreground);
  margin: 0;
}

.drawer-header__count {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-muted-foreground);
}

.drawer-header__sub-info {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--color-muted-foreground);
}

.drawer-header__subgroup {
  font-weight: 600;
  color: var(--color-card-foreground);
}

.drawer-header__actions {
  margin-top: 4px;
}

.drawer-table {
  font-family: var(--font-sans);
  font-size: 13px;
}

.drawer-table :deep(.el-table__header th) {
  background: var(--color-muted) !important;
  font-weight: 600;
  font-size: 12px;
  color: var(--color-muted-foreground);
}

.drawer-table__filename {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-card-foreground);
  word-break: break-all;
}

.drawer-table__subgroup {
  font-size: 12px;
  color: var(--color-muted-foreground);
}

.drawer-table__date {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-card-foreground);
}

:deep(.drawer-table__row--overdue) {
  background: rgba(249, 115, 22, 0.04) !important;
}
</style>
