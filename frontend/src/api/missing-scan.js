// @ts-check
/**
 * API layer for the Missing File Scan Dashboard.
 *
 * Each `fetch*` function is a **placeholder** — it returns mock data shaped
 * like the backend response defined in `missing_file_summary_response.json`.
 * When the real backend is ready, replace the body of each function with an
 * actual HTTP call (fetch / axios) while keeping the same return type.
 *
 * Each `transform*` function converts the backend response into the frontend
 * types consumed by Vue components (Group, ToolRow, Summary, etc.).
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
 * @returns {Promise<{ data: RawGroup[] }>}
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

// ─── Transform: backend response → frontend types ─────────────────────────────

/**
 * @typedef {Object} RawSubGroup
 * @property {string} group_name  - sub-group name (backend field)
 * @property {number} missed
 * @property {number} failed
 * @property {number} overdue_missed
 * @property {number} overdue_failed
 */

/**
 * @typedef {Object} RawSummary
 * @property {number} summary_id   - (-1 means unscanned)
 * @property {string} tool_name
 * @property {number} passed       - (-1 means unscanned)
 * @property {number} missed       - (-1 means unscanned)
 * @property {number} failed       - (-1 means unscanned)
 * @property {number} shielded     - (-1 means unscanned)
 * @property {number} remapped     - (-1 means unscanned)
 * @property {number} overdue_missed
 * @property {number} overdue_failed
 * @property {string} scan_time
 * @property {string} create_time
 * @property {string} report_url
 * @property {RawSubGroup[]} sub_groups
 */

/**
 * @typedef {Object} RawGroup
 * @property {string} search_version
 * @property {string} c_version
 * @property {string} data_type
 * @property {string} source_type
 * @property {string} lan
 * @property {string} product
 * @property {RawSummary[]} summarys
 */

/**
 * Transform the raw backend response into the frontend `Group[]` structure.
 *
 * @param {{ data: RawGroup[] }} response
 * @returns {import('../data/types.js').Group[]}
 */
export function transformSummaryResponse(response) {
  return (response.data || []).map((rawGroup) => {
    /** @type {import('../data/types.js').ToolRow[]} */
    const tools = (rawGroup.summarys || []).map((rawSummary) => {
      const isUnscanned = rawSummary.summary_id === -1

      /** @type {import('../data/types.js').Summary | null} */
      const summary = isUnscanned
        ? null
        : {
            summary_id: rawSummary.summary_id,
            task_id: -1, // not provided by this backend endpoint
            passed_count: rawSummary.passed,
            missing_count: rawSummary.missed,
            failed_count: rawSummary.failed,
            overdue_missing_count: rawSummary.overdue_missed,
            overdue_failed_count: rawSummary.overdue_failed,
            remapped_count: rawSummary.remapped,
            shielded_count: rawSummary.shielded,
            report_url: rawSummary.report_url,
            scan_time: rawSummary.scan_time,
            create_time: rawSummary.create_time,
            is_active: 1,
            sub_groups: (rawSummary.sub_groups || []).map((sg) => ({
              sub_group_name: sg.group_name,
              missing_count: sg.missed,
              failed_count: sg.failed,
              overdue_missing_count: sg.overdue_missed,
              overdue_failed_count: sg.overdue_failed,
              remapped_count: 0,
              shielded_count: 0,
            })),
          }

      return {
        tool_name: rawSummary.tool_name,
        summary,
        sub_groups: summary ? summary.sub_groups : [],
        missingFiles: [], // files are loaded on-demand via fetchMissingFiles()
      }
    })

    return {
      search_version: rawGroup.search_version,
      product: rawGroup.product,
      group_name: '', // not in backend response; may need backend addition
      lan: rawGroup.lan,
      source_type: rawGroup.source_type,
      data_type: rawGroup.data_type,
      tools,
    }
  })
}

/**
 * Compute overview statistics from transformed groups.
 * (Same logic as the old selectors.getOverviewStats, kept here for cohesion.)
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
    for (const tool of group.tools) {
      totalTasks++

      if (!tool.summary) {
        noResultTasks++
        continue
      }

      if (tool.summary.missing_count > 0 || tool.summary.failed_count > 0) {
        hasMissingTasks++
      }

      if (tool.summary.overdue_missing_count > 0 || tool.summary.overdue_failed_count > 0) {
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
 * @returns {{ data: RawGroup[] }}
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
  /** @type {Map<number, import('../data/types.js').Summary>} */
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
  /** @type {RawGroup[]} */
  const data = []

  for (const [, groupTasks] of groupMap) {
    const first = groupTasks[0]

    /** @type {RawSummary[]} */
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
      /** @type {RawSubGroup[]} */
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
        const categories = getRawSummaryStatusCategories(rs)
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
      summarys: filteredSummarys,
    })
  }

  return { data }
}

/**
 * Determine status categories for a raw summary (for task_status filtering).
 * @param {RawSummary} rs
 * @returns {string[]}
 */
function getRawSummaryStatusCategories(rs) {
  if (rs.summary_id === -1) return ['未扫描']

  const cats = []
  if (rs.missed > 0 || rs.failed > 0) cats.push('缺失')
  if (rs.overdue_missed > 0 || rs.overdue_failed > 0) cats.push('超期')
  if (cats.length === 0) cats.push('通过')

  return cats
}
