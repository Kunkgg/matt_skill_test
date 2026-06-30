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

    <!-- Loading State -->
    <div v-if="loading" class="scan-board__loading">
      <el-skeleton :rows="4" animated />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="scan-board__error">
      <el-alert
        :title="error"
        type="error"
        show-icon
        :closable="false"
      />
      <el-button type="primary" style="margin-top: 12px" @click="loadData">重试</el-button>
    </div>

    <template v-else>
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
    </template>

    <!-- File Detail Drawer -->
    <FileDetailDrawer
      v-model:visible="drawerVisible"
      :context="drawerContext"
      :files="drawerFiles"
      :loading="drawerLoading"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import {
  fetchSummaryData,
  fetchFilterOptions,
  fetchMissingFiles,
  computeOverviewStats,
} from '../api/missing-scan.js'
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

// --- Reactive data (populated by API) ---
const filterOptions = ref({
  versions: [],
  group_names: [],
  products: [],
  source_types: [],
  lans: [],
  data_types: [],
  tool_names: [],
})

const groups = ref([])
const stats = ref({ totalTasks: 0, noResultTasks: 0, hasMissingTasks: 0, hasExpiredMissingTasks: 0 })
const loading = ref(false)
const error = ref(null)

// --- Load filter options (once on mount) ---
async function loadFilterOptions() {
  try {
    filterOptions.value = await fetchFilterOptions()
  } catch (e) {
    console.error('Failed to load filter options:', e)
  }
}

// --- Load dashboard data (summary groups + stats) ---
async function loadData() {
  loading.value = true
  error.value = null
  try {
    const response = await fetchSummaryData(filters.value)
    groups.value = response.data || []
    stats.value = computeOverviewStats(groups.value)
  } catch (e) {
    console.error('Failed to load summary data:', e)
    error.value = '加载数据失败，请检查网络后重试。'
    groups.value = []
    stats.value = { totalTasks: 0, noResultTasks: 0, hasMissingTasks: 0, hasExpiredMissingTasks: 0 }
  } finally {
    loading.value = false
  }
}

// --- Init on mount ---
onMounted(async () => {
  await Promise.all([loadFilterOptions(), loadData()])
})

// --- Re-fetch when filters change ---
let filterDebounceTimer = null
watch(
  filters,
  (newFilters) => {
    // Sync URL params
    syncUrlParams(newFilters)

    // Debounced re-fetch
    if (filterDebounceTimer) clearTimeout(filterDebounceTimer)
    filterDebounceTimer = setTimeout(() => {
      loadData()
    }, 300)
  },
  { deep: true }
)

// --- URL sync ---
function syncUrlParams(newFilters) {
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
}

// --- Drawer ---
const drawerVisible = ref(false)
const drawerContext = ref({})
const drawerFiles = ref([])
const drawerLoading = ref(false)

async function handleCountClick(event, group) {
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

  drawerContext.value = context
  drawerFiles.value = []
  drawerLoading.value = true
  drawerVisible.value = true

  // Fetch files asynchronously
  try {
    const statusFilter = mapStatusTypeToFilter(status_type, sub_group)
    const files = await fetchMissingFiles(summary_id, statusFilter)
    drawerFiles.value = files
  } catch (e) {
    console.error('Failed to load missing files:', e)
    drawerFiles.value = []
  } finally {
    drawerLoading.value = false
  }
}

function findReportUrl(group, toolName) {
  const summary = (group.summarys || []).find((s) => s.tool_name === toolName)
  return summary?.report_url || null
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

// --- Refresh: re-fetch data from API ---
function handleRefresh() {
  loadFilterOptions()
  loadData()
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

.scan-board__loading {
  padding: 32px 0;
}

.scan-board__error {
  padding: 32px 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
</style>
