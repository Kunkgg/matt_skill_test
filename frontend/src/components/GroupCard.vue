<template>
  <el-card class="group-card" shadow="never">
    <!-- Header: 6 dimension pairs -->
    <div class="group-card__header">
      <div class="group-card__dim" v-for="dim in dimensions" :key="dim.label">
        <span class="group-card__dim-label">{{ dim.label }}</span>
        <span class="group-card__dim-value">{{ dim.value || '—' }}</span>
      </div>
    </div>

    <!-- Tool table with tree expand -->
    <el-table
      :data="tableData"
      row-key="rowKey"
      :tree-props="{ children: 'children' }"
      :default-expand-all="false"
      border
      size="small"
      class="group-card__table"
      :row-class-name="rowClassName"
    >
      <el-table-column label="扫描工具" prop="tool_name" min-width="160" fixed>
        <template #default="{ row }">
          <template v-if="row.isUnscanned">
            <el-tag type="info" size="small" class="group-card__unscanned-tag">
              未扫描
            </el-tag>
          </template>
          <template v-else>
            <span :class="{ 'group-card__subgroup-name': row.rowType === 'sub_group' }">
              {{ row.tool_name }}
            </span>
          </template>
        </template>
      </el-table-column>

      <el-table-column label="通过" prop="passed_count" width="80" align="center">
        <template #default="{ row }">
          <template v-if="row.isUnscanned"><span class="count-muted">—</span></template>
          <template v-else>
            <span :class="countClass(row.passed_count, 'ok')">
              {{ row.passed_count ?? 0 }}
            </span>
          </template>
        </template>
      </el-table-column>

      <el-table-column label="缺失" prop="missing_count" width="80" align="center">
        <template #default="{ row }">
          <template v-if="row.isUnscanned"><span class="count-muted">—</span></template>
          <template v-else>
            <span
              :class="countClass(row.missing_count, 'missed')"
              :style="clickableStyle(row.missing_count)"
              @click="handleCountClick(row, 'missing', row.missing_count)"
            >
              {{ row.missing_count ?? 0 }}
            </span>
          </template>
        </template>
      </el-table-column>

      <el-table-column label="失败" prop="failed_count" width="80" align="center">
        <template #default="{ row }">
          <template v-if="row.isUnscanned"><span class="count-muted">—</span></template>
          <template v-else>
            <span
              :class="countClass(row.failed_count, 'failed')"
              :style="clickableStyle(row.failed_count)"
              @click="handleCountClick(row, 'failed', row.failed_count)"
            >
              {{ row.failed_count ?? 0 }}
            </span>
          </template>
        </template>
      </el-table-column>

      <el-table-column label="过期缺失" prop="overdue_missing_count" width="90" align="center">
        <template #default="{ row }">
          <template v-if="row.isUnscanned"><span class="count-muted">—</span></template>
          <template v-else>
            <span
              :class="countClass(row.overdue_missing_count, 'expired')"
              :style="clickableStyle(row.overdue_missing_count)"
              @click="handleCountClick(row, 'overdue_missing', row.overdue_missing_count)"
            >
              {{ row.overdue_missing_count ?? 0 }}
            </span>
          </template>
        </template>
      </el-table-column>

      <el-table-column label="过期失败" prop="overdue_failed_count" width="90" align="center">
        <template #default="{ row }">
          <template v-if="row.isUnscanned"><span class="count-muted">—</span></template>
          <template v-else>
            <span
              :class="countClass(row.overdue_failed_count, 'expired')"
              :style="clickableStyle(row.overdue_failed_count)"
              @click="handleCountClick(row, 'overdue_failed', row.overdue_failed_count)"
            >
              {{ row.overdue_failed_count ?? 0 }}
            </span>
          </template>
        </template>
      </el-table-column>

      <el-table-column label="屏蔽" prop="shielded_count" width="80" align="center">
        <template #default="{ row }">
          <template v-if="row.isUnscanned"><span class="count-muted">—</span></template>
          <template v-else>
            <span :class="countClass(row.shielded_count, 'neutral')">
              {{ row.shielded_count ?? 0 }}
            </span>
          </template>
        </template>
      </el-table-column>

      <el-table-column label="重映射" prop="remapped_count" width="80" align="center">
        <template #default="{ row }">
          <template v-if="row.isUnscanned"><span class="count-muted">—</span></template>
          <template v-else>
            <span :class="countClass(row.remapped_count, 'neutral')">
              {{ row.remapped_count ?? 0 }}
            </span>
          </template>
        </template>
      </el-table-column>

      <el-table-column label="开始时间" width="110" align="center">
        <template #default="{ row }">
          <span v-if="row.scan_time" class="group-card__date">
            {{ formatDate(row.scan_time) }}
          </span>
          <span v-else class="count-muted">—</span>
        </template>
      </el-table-column>

      <el-table-column label="创建时间" width="110" align="center">
        <template #default="{ row }">
          <span v-if="row.create_time" class="group-card__date">
            {{ formatDate(row.create_time) }}
          </span>
          <span v-else class="count-muted">—</span>
        </template>
      </el-table-column>

      <el-table-column label="报告" width="70" align="center">
        <template #default="{ row }">
          <a
            v-if="row.report_url"
            :href="row.report_url"
            target="_blank"
            rel="noopener noreferrer"
            class="group-card__report-link"
            title="查看报告"
          >
            <el-icon :size="16"><Link /></el-icon>
          </a>
          <span v-else class="count-muted">—</span>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { Link } from '@element-plus/icons-vue'

const props = defineProps({
  group: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['count-click'])

const dimensions = computed(() => [
  { label: '版本', value: props.group.search_version },
  { label: '组件组', value: props.group.group_name },
  { label: '产品', value: props.group.product },
  { label: '编程语言', value: props.group.lan },
  { label: '代码类型', value: props.group.source_type },
  { label: '数据类型', value: props.group.data_type },
])

const tableData = computed(() => {
  return (props.group.tools || []).map((tool) => {
    const s = tool.summary
    const isUnscanned = !s

    const row = {
      rowKey: `tool-${tool.tool_name}`,
      rowType: 'tool',
      tool_name: tool.tool_name,
      isUnscanned,
      passed_count: s?.passed_count ?? null,
      missing_count: s?.missing_count ?? null,
      failed_count: s?.failed_count ?? null,
      overdue_missing_count: s?.overdue_missing_count ?? null,
      overdue_failed_count: s?.overdue_failed_count ?? null,
      remapped_count: s?.remapped_count ?? null,
      shielded_count: s?.shielded_count ?? null,
      scan_time: s?.scan_time ?? null,
      create_time: s?.create_time ?? null,
      report_url: s?.report_url ?? null,
      _summary_id: s?.summary_id ?? null,
      _tool_name: tool.tool_name,
    }

    if (tool.sub_groups && tool.sub_groups.length > 0 && !isUnscanned) {
      row.children = tool.sub_groups.map((sg) => ({
        rowKey: `tool-${tool.tool_name}-sg-${sg.sub_group_name}`,
        rowType: 'sub_group',
        tool_name: sg.sub_group_name,
        isUnscanned: false,
        passed_count: null,
        missing_count: sg.missing_count ?? 0,
        failed_count: sg.failed_count ?? 0,
        overdue_missing_count: sg.overdue_missing_count ?? 0,
        overdue_failed_count: sg.overdue_failed_count ?? 0,
        remapped_count: sg.remapped_count ?? 0,
        shielded_count: sg.shielded_count ?? 0,
        scan_time: null,
        create_time: null,
        report_url: null,
        _summary_id: s?.summary_id ?? null,
        _tool_name: tool.tool_name,
        _sub_group: sg.sub_group_name,
      }))
    }

    return row
  })
})

function rowClassName({ row }) {
  if (row.isUnscanned) return 'group-card__row--unscanned'
  if (row.rowType === 'sub_group') return 'group-card__row--subgroup'
  return ''
}

function countClass(value, type) {
  if (value === null || value === undefined) return 'count-muted'
  if (value === 0) return 'count-zero'
  return `count-${type}`
}

function clickableStyle(value) {
  if (value && value > 0) {
    return { cursor: 'pointer' }
  }
  return {}
}

function handleCountClick(row, statusType, count) {
  if (!count || count <= 0) return
  const summaryId = row._summary_id
  if (!summaryId) return

  emit('count-click', {
    summary_id: summaryId,
    tool_name: row._tool_name,
    status_type: statusType,
    sub_group: row._sub_group || undefined,
  })
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
.group-card {
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  background: var(--color-card);
  margin-bottom: 20px;
  overflow: hidden;
}

.group-card__header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-muted);
}

.group-card__dim {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.group-card__dim-label {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--color-muted-foreground);
  font-weight: 500;
}

.group-card__dim-value {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-card-foreground);
}

.group-card__table {
  width: 100%;
  font-family: var(--font-sans);
  font-size: 13px;
}

.group-card__table :deep(.el-table__header th) {
  background: var(--color-muted) !important;
  font-weight: 600;
  font-size: 12px;
  color: var(--color-muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.group-card__table :deep(.el-table__row) {
  transition: background 0.12s ease;
}

.group-card__table :deep(.el-table__row:hover > td) {
  background: rgba(59, 130, 246, 0.03) !important;
}

.group-card__unscanned-tag {
  font-size: 12px;
}

.group-card__subgroup-name {
  font-size: 12px;
  color: var(--color-muted-foreground);
  padding-left: 4px;
}

.group-card__date {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-card-foreground);
}

.group-card__report-link {
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
  transition: color 0.15s ease;
}

.group-card__report-link:hover {
  color: #2563eb;
}

/* Count styles */
.count-zero {
  color: var(--color-muted-foreground);
  font-size: 13px;
}

.count-muted {
  color: var(--color-muted-foreground);
  font-size: 13px;
}

.count-ok {
  color: var(--color-ok);
  font-weight: 700;
  font-size: 13px;
}

.count-missed {
  color: var(--color-missed);
  font-weight: 700;
  font-size: 13px;
}

.count-failed {
  color: var(--color-failed);
  font-weight: 700;
  font-size: 13px;
}

.count-expired {
  color: var(--color-expired);
  font-weight: 700;
  font-size: 13px;
}

.count-neutral {
  color: var(--color-neutral);
  font-weight: 600;
  font-size: 13px;
}

/* Clickable counts */
.count-missed[style*="cursor"],
.count-failed[style*="cursor"],
.count-expired[style*="cursor"] {
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 3px;
}

.count-missed[style*="cursor"]:hover,
.count-failed[style*="cursor"]:hover,
.count-expired[style*="cursor"]:hover {
  opacity: 0.8;
}

/* Row type styling */
:deep(.group-card__row--unscanned) {
  background: var(--color-muted) !important;
}

:deep(.group-card__row--subgroup) td {
  background: rgba(241, 245, 249, 0.5) !important;
  font-size: 12px;
}
</style>
