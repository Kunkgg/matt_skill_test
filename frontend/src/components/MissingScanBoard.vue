<template>
  <div class="scan-board">
    <!-- Title -->
    <div class="scan-board__title-section">
      <div class="scan-board__title-bar"></div>
      <div class="scan-board__title-content">
        <h1 class="scan-board__title">缺失文件扫描看板</h1>
        <p class="scan-board__subtitle">
          比对扫描工具结果与组件文件清单，定位未被扫描覆盖的文件。
        </p>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <FilterToolbar
      v-model="filters"
      :filter-options="filterOptions"
      @refresh="handleRefresh"
      @navigate="handleNavigate"
    />

    <!-- Overview Cards -->
    <OverviewCards :stats="stats" />

    <!-- Group Cards -->
    <div class="scan-board__groups">
      <div v-if="groups.length === 0" class="scan-board__empty">
        <el-empty description="暂无匹配数据" />
      </div>
      <GroupCard
        v-for="(group, index) in groups"
        :key="groupKey(group, index)"
        :group="group"
        @count-click="handleCountClick($event, group)"
      />
    </div>

    <!-- File Detail Drawer -->
    <FileDetailDrawer
      v-model:visible="drawerVisible"
      :context="drawerContext"
      :files="drawerFiles"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  getFilterOptions,
  getFilteredGroups,
  getOverviewStats,
  getMissingFiles,
} from '../data/selectors.js'
import FilterToolbar from './FilterToolbar.vue'
import OverviewCards from './OverviewCards.vue'
import GroupCard from './GroupCard.vue'
import FileDetailDrawer from './FileDetailDrawer.vue'

// --- Filters (init from URL params) ---
function parseUrlFilters() {
  const allStatuses = ['通过', '缺失', '超期', '未扫描']
  const params = new URLSearchParams(window.location.search)
  const statusParam = params.get('task_status')
  return {
    search_version: params.get('search_version') || '',
    group_name: params.get('group_name') || '',
    product: params.get('product') || '',
    source_type: params.get('source_type') || '',
    lan: params.get('lan') || '',
    data_type: params.get('data_type') || '',
    tool_name: params.get('tool_name') || '',
    task_status: statusParam ? statusParam.split(',') : [...allStatuses],
  }
}

const filters = ref(parseUrlFilters())

// --- Computed data ---
const filterOptions = computed(() => getFilterOptions())

const groups = computed(() => getFilteredGroups(filters.value))

const stats = computed(() => getOverviewStats(groups.value))

// --- URL sync ---
watch(
  filters,
  (newFilters) => {
    const allStatuses = ['通过', '缺失', '超期', '未扫描']
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(newFilters)) {
      if (key === 'task_status') {
        // Only persist if not all selected (all-selected is the default)
        if (Array.isArray(value) && value.length > 0 && value.length < allStatuses.length) {
          params.set(key, value.join(','))
        }
      } else if (value !== '' && value !== false) {
        params.set(key, String(value))
      }
    }
    const qs = params.toString()
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    window.history.replaceState({}, '', url)
  },
  { deep: true }
)

// --- Drawer ---
const drawerVisible = ref(false)
const drawerContext = ref({})
const drawerFiles = ref([])

function handleCountClick(event, group) {
  const { summary_id, tool_name, status_type, sub_group } = event

  // Build context for drawer header
  const context = {
    summary_id,
    tool_name,
    status_type,
    sub_group,
    search_version: group.search_version,
    product: group.product,
    group_name: group.group_name,
    report_url: findReportUrl(group, tool_name),
  }

  // Get files filtered by status
  const statusFilter = mapStatusTypeToFilter(status_type, sub_group)
  const files = getMissingFiles(summary_id, statusFilter)

  drawerContext.value = context
  drawerFiles.value = files
  drawerVisible.value = true
}

function findReportUrl(group, toolName) {
  const tool = (group.tools || []).find((t) => t.tool_name === toolName)
  return tool?.summary?.report_url || null
}

function mapStatusTypeToFilter(statusType, subGroup) {
  const filter = {}

  if (statusType === 'missing') {
    filter.status = 'missing'
  } else if (statusType === 'failed') {
    filter.status = 'failed'
  } else if (statusType === 'overdue_missing') {
    filter.status = 'missing'
    filter.is_overdue = true
  } else if (statusType === 'overdue_failed') {
    filter.status = 'failed'
    filter.is_overdue = true
  }

  if (subGroup) {
    filter.sub_group = subGroup
  }

  return filter
}

function groupKey(group, index) {
  return `${group.search_version}-${group.group_name}-${group.product}-${index}`
}

// --- Refresh: re-fetch data with current filters ---
function handleRefresh() {
  // TODO: Replace with actual API call when backend is ready.
  // For now, force re-compute by toggling a reactive trigger.
  const current = { ...filters.value }
  filters.value = { ...current }
}

// --- Navigate to related pages ---
const NAV_URLS = {
  guide: '/guide/missing-files',
  shield: '/config/shield',
  remap: '/config/remap',
}

function handleNavigate(target) {
  const url = NAV_URLS[target]
  if (url) {
    window.open(url, '_blank')
  }
}
</script>

<style scoped>
.scan-board {
  font-family: var(--font-sans);
}

.scan-board__title-section {
  display: flex;
  align-items: stretch;
  gap: 16px;
  margin-bottom: 24px;
}

.scan-board__title-bar {
  width: 4px;
  border-radius: 2px;
  background: var(--color-primary);
  flex-shrink: 0;
}

.scan-board__title-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scan-board__title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-foreground);
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.3px;
}

.scan-board__subtitle {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--color-muted-foreground);
  margin: 0;
  line-height: 1.5;
}

.scan-board__groups {
  display: flex;
  flex-direction: column;
}

.scan-board__empty {
  padding: 48px 0;
}
</style>
