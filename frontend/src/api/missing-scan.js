// @ts-check
/**
 * API layer for the Missing File Scan Dashboard.
 *
 * Each `fetch*` function is a **placeholder** — it returns mock data shaped
 * like the backend response defined in `missing_file_summary_response.json`.
 * When the real backend is ready, replace the body of each function with an
 * actual HTTP call (fetch / axios) while keeping the same return type.
 */

// ─── Mock data import (remove when real backend is ready) ─────────────────────
import { tasks, summaries, missingFiles } from '../data/sample-data.js'

// ─── Placeholder API functions ────────────────────────────────────────────────

/**
 * Fetch summary data for the dashboard (grouped & filtered by the backend).
 *
 * Backend endpoint (future): GET /api/missing-file/summary?search_version=...&product=...
 *
 * @param {import('../data/types.js').Filters} filters
 * @returns {Promise<{ data: import('../data/types.js').Group[] }>}
 */
export async function fetchSummaryData(filters) {
  // TODO: Replace with real API call, e.g.:
  // const params = buildQueryParams(filters)
  // const response = await fetch(`/api/missing-file/summary?${params}`)
  // return response.json()

  // --- Placeholder: build response from local mock data ---
  return buildMockSummaryResponse(filters)
}

/**
 * Fetch filter option values (all available choices for each dimension).
 *
 * Backend endpoint (future): GET /api/missing-file/filter-options
 *
 * @returns {Promise<{
 *   versions: string[],
 *   group_names: string[],
 *   products: string[],
 *   source_types: string[],
 *   lans: string[],
 *   data_types: string[],
 *   tool_names: string[],
 * }>}
 */
export async function fetchFilterOptions() {
  // TODO: Replace with real API call, e.g.:
  // const response = await fetch('/api/missing-file/filter-options')
  // return response.json()

  // --- Placeholder: derive from local mock data ---
  const activeTasks = tasks.filter((t) => t.is_active === 1)
  const unique = (/** @type {string[]} */ arr) => [...new Set(arr)].sort()

  return {
    versions: unique(activeTasks.map((t) => t.search_version)),
    group_names: unique(activeTasks.map((t) => t.group_name)),
    products: unique(activeTasks.map((t) => t.product)),
    source_types: unique(activeTasks.map((t) => t.source_type)),
    lans: unique(activeTasks.map((t) => t.lan)),
    data_types: unique(activeTasks.map((t) => t.data_type)),
    tool_names: unique(activeTasks.map((t) => t.tool_name)),
  }
}

/**
 * Fetch missing file detail list for a given summary.
 * Called when the user clicks a count in GroupCard to open the Drawer.
 *
 * Backend endpoint (future): GET /api/missing-file/files?summary_id=...&status=...&sub_group=...
 *
 * @param {number} summaryId
 * @param {{ status?: string, sub_group?: string, is_overdue?: boolean }} [filter]
 * @returns {Promise<import('../data/types.js').MissingFile[]>}
 */
export async function fetchMissingFiles(summaryId, filter) {
  // TODO: Replace with real API call, e.g.:
  // const params = new URLSearchParams({ summary_id: String(summaryId) })
  // if (filter?.status) params.set('status', filter.status)
  // if (filter?.sub_group) params.set('sub_group', filter.sub_group)
  // if (filter?.is_overdue) params.set('is_overdue', '1')
  // const response = await fetch(`/api/missing-file/files?${params}`)
  // return (await response.json()).data

  // --- Placeholder: filter from local mock data ---
  let results = missingFiles.filter((mf) => mf.summary_id === summaryId)

  if (filter?.status) {
    results = results.filter((mf) => mf.status === filter.status)
  }
  if (filter?.sub_group) {
    results = results.filter((mf) => mf.sub_group === filter.sub_group)
  }
  if (filter?.is_overdue) {
    results = results.filter((mf) => mf.is_overdue === 1)
  }

  return results
}

/**
 * Compute overview statistics from groups using backend field names.
 *
 * @param {import('../data/types.js').Group[]} groups
 * @returns {import('../data/types.js').OverviewStats}
 */
export function computeOverviewStats(groups) {
  let totalTasks = 0
  let noResultTasks = 0
  let hasMissingTasks = 0
  let hasExpiredMissingTasks = 0

  for (const group of groups) {
    for (const summary of group.summarys) {
      totalTasks++

      if (summary.summary_id === -1) {
        noResultTasks++
        continue
      }

      if (summary.missed > 0 || summary.failed > 0) {
        hasMissingTasks++
      }

      if (summary.overdue_missed > 0 || summary.overdue_failed > 0) {
        hasExpiredMissingTasks++
      }
    }
  }

  return { totalTasks, noResultTasks, hasMissingTasks, hasExpiredMissingTasks }
}

// ─── Private helpers (mock data builder) ──────────────────────────────────────

/**
 * Build a mock response shaped like `missing_file_summary_response.json`
 * from the existing local sample-data.
 *
 * @param {import('../data/types.js').Filters} filters
 * @returns {{ data: import('../data/types.js').Group[] }}
 */
function buildMockSummaryResponse(filters) {
  // 1. Filter active tasks
  let filtered = tasks.filter((t) => t.is_active === 1)

  if (filters.search_version) filtered = filtered.filter((t) => t.search_version === filters.search_version)
  if (filters.group_name) filtered = filtered.filter((t) => t.group_name === filters.group_name)
  if (filters.product) filtered = filtered.filter((t) => t.product === filters.product)
  if (filters.source_type) filtered = filtered.filter((t) => t.source_type === filters.source_type)
  if (filters.lan) filtered = filtered.filter((t) => t.lan === filters.lan)
  if (filters.data_type) filtered = filtered.filter((t) => t.data_type === filters.data_type)
  if (filters.tool_name) filtered = filtered.filter((t) => t.tool_name === filters.tool_name)

  // 2. Build summary lookup
  /** @type {Map<number, import('../data/types.js').LegacySummary>} */
  const summaryByTask = new Map()
  for (const s of summaries) {
    if (s.is_active !== 1) continue
    const existing = summaryByTask.get(s.task_id)
    if (!existing || s.scan_time > existing.scan_time) {
      summaryByTask.set(s.task_id, s)
    }
  }

  // 3. Build missing-files lookup
  /** @type {Map<number, import('../data/types.js').MissingFile[]>} */
  const mfBySummary = new Map()
  for (const mf of missingFiles) {
    const list = mfBySummary.get(mf.summary_id)
    if (list) list.push(mf)
    else mfBySummary.set(mf.summary_id, [mf])
  }

  // 4. Group by 6 dimensions
  /** @type {Map<string, import('../data/types.js').Task[]>} */
  const groupMap = new Map()
  for (const t of filtered) {
    const key = [t.search_version, t.product, t.group_name, t.lan, t.source_type, t.data_type].join('|')
    const list = groupMap.get(key)
    if (list) list.push(t)
    else groupMap.set(key, [t])
  }

  // 5. Build raw groups
  /** @type {import('../data/types.js').Group[]} */
  const data = []

  for (const [, groupTasks] of groupMap) {
    const first = groupTasks[0]

    /** @type {import('../data/types.js').SummaryItem[]} */
    const rawSummarys = []

    for (const task of groupTasks) {
      const summary = summaryByTask.get(task.task_id)

      if (!summary) {
        // Unscanned tool
        rawSummarys.push({
          summary_id: -1,
          tool_name: task.tool_name,
          passed: -1,
          missed: -1,
          failed: -1,
          shielded: -1,
          remapped: -1,
          overdue_missed: -1,
          overdue_failed: -1,
          scan_time: '',
          create_time: '',
          report_url: '',
          sub_groups: [],
        })
        continue
      }

      // Build sub_groups in backend format
      /** @type {import('../data/types.js').SubGroup[]} */
      const rawSubGroups = (summary.sub_groups || []).map((sg) => ({
        group_name: sg.sub_group_name,
        missed: sg.missing_count,
        failed: sg.failed_count,
        overdue_missed: sg.overdue_missing_count,
        overdue_failed: sg.overdue_failed_count,
      }))

      rawSummarys.push({
        summary_id: summary.summary_id,
        tool_name: task.tool_name,
        passed: summary.passed_count,
        missed: summary.missing_count,
        failed: summary.failed_count,
        shielded: summary.shielded_count,
        remapped: summary.remapped_count,
        overdue_missed: summary.overdue_missing_count,
        overdue_failed: summary.overdue_failed_count,
        scan_time: summary.scan_time,
        create_time: summary.create_time,
        report_url: summary.report_url,
        sub_groups: rawSubGroups,
      })
    }

    // Apply task_status filter on the raw summarys
    const statusSet = filters.task_status
    const allStatuses = ['通过', '缺失', '超期', '未扫描']
    const isAllSelected = !statusSet || statusSet.length === 0 || statusSet.length === allStatuses.length

    let filteredSummarys = rawSummarys
    if (!isAllSelected) {
      filteredSummarys = rawSummarys.filter((rs) => {
        const categories = getSummaryStatusCategories(rs)
        return categories.some((cat) => statusSet.includes(cat))
      })
    }

    if (filteredSummarys.length === 0) continue

    data.push({
      search_version: first.search_version,
      c_version: '',
      data_type: first.data_type,
      source_type: first.source_type,
      lan: first.lan,
      product: first.product,
      group_name: first.group_name,
      summarys: filteredSummarys,
    })
  }

  return { data }
}

/**
 * Determine status categories for a summary item (for task_status filtering).
 * @param {import('../data/types.js').SummaryItem} rs
 * @returns {string[]}
 */
function getSummaryStatusCategories(rs) {
  if (rs.summary_id === -1) return ['未扫描']

  const cats = []
  if (rs.missed > 0 || rs.failed > 0) cats.push('缺失')
  if (rs.overdue_missed > 0 || rs.overdue_failed > 0) cats.push('超期')
  if (cats.length === 0) cats.push('通过')

  return cats
}
