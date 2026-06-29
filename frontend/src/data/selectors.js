// @ts-check
import { tasks, summaries, missingFiles } from './sample-data.js'

/**
 * Return unique filter option values from active tasks for each dimension.
 * @returns {{
 *   versions: string[],
 *   group_names: string[],
 *   products: string[],
 *   source_types: string[],
 *   lans: string[],
 *   data_types: string[],
 *   tool_names: string[],
 * }}
 */
export function getFilterOptions() {
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
 * Build a lookup key for grouping tasks by their 6 dimensions (excluding tool_name).
 * @param {import('./types.js').Task} task
 * @returns {string}
 */
function groupKey(task) {
  return [
    task.search_version,
    task.product,
    task.group_name,
    task.lan,
    task.source_type,
    task.data_type,
  ].join('|')
}

/**
 * Build a summary lookup map keyed by task_id.
 * Only active summaries are included. If multiple exist, the latest by scan_time wins.
 * @returns {Map<number, import('./types.js').Summary>}
 */
function buildSummaryLookup() {
  /** @type {Map<number, import('./types.js').Summary>} */
  const map = new Map()
  for (const s of summaries) {
    if (s.is_active !== 1) continue
    const existing = map.get(s.task_id)
    if (!existing || s.scan_time > existing.scan_time) {
      map.set(s.task_id, s)
    }
  }
  return map
}

/**
 * Build a missing-files lookup map keyed by summary_id.
 * @returns {Map<number, import('./types.js').MissingFile[]>}
 */
function buildMissingFilesLookup() {
  /** @type {Map<number, import('./types.js').MissingFile[]>} */
  const map = new Map()
  for (const mf of missingFiles) {
    const list = map.get(mf.summary_id)
    if (list) {
      list.push(mf)
    } else {
      map.set(mf.summary_id, [mf])
    }
  }
  return map
}

/**
 * Get filtered and grouped data for the dashboard.
 *
 * @param {import('./types.js').Filters} filters
 * @returns {import('./types.js').Group[]}
 */
export function getFilteredGroups(filters) {
  const summaryByTask = buildSummaryLookup()
  const mfBySummary = buildMissingFilesLookup()

  // 1. Filter active tasks by dimension filters (empty string = no filter)
  let filtered = tasks.filter((t) => t.is_active === 1)

  if (filters.search_version) filtered = filtered.filter((t) => t.search_version === filters.search_version)
  if (filters.group_name) filtered = filtered.filter((t) => t.group_name === filters.group_name)
  if (filters.product) filtered = filtered.filter((t) => t.product === filters.product)
  if (filters.source_type) filtered = filtered.filter((t) => t.source_type === filters.source_type)
  if (filters.lan) filtered = filtered.filter((t) => t.lan === filters.lan)
  if (filters.data_type) filtered = filtered.filter((t) => t.data_type === filters.data_type)
  if (filters.tool_name) filtered = filtered.filter((t) => t.tool_name === filters.tool_name)

  // 2. Group by 6 dimensions (excluding tool_name)
  /** @type {Map<string, import('./types.js').Task[]>} */
  const groups = new Map()
  for (const t of filtered) {
    const key = groupKey(t)
    const list = groups.get(key)
    if (list) {
      list.push(t)
    } else {
      groups.set(key, [t])
    }
  }

  // 3. For each group, create ToolRow[] with matched summary and missingFiles
  /** @type {import('./types.js').Group[]} */
  const result = []

  for (const [, groupTasks] of groups) {
    const first = groupTasks[0]

    /** @type {import('./types.js').ToolRow[]} */
    const toolRows = []

    for (const task of groupTasks) {
      const summary = summaryByTask.get(task.task_id) ?? null
      const files = summary ? (mfBySummary.get(summary.summary_id) ?? []) : []
      const subGroups = summary ? summary.sub_groups : []

      toolRows.push({
        tool_name: task.tool_name,
        summary,
        sub_groups: subGroups,
        missingFiles: files,
      })
    }

    // 4. Apply show_issue_only / show_expired_only filters
    let filteredTools = toolRows

    if (filters.show_issue_only) {
      filteredTools = filteredTools.filter((tr) => {
        if (!tr.summary) return true // no scan = an issue
        return tr.summary.missing_count > 0 || tr.summary.failed_count > 0
      })
    }

    if (filters.show_expired_only) {
      filteredTools = filteredTools.filter((tr) => {
        if (!tr.summary) return false
        return tr.summary.overdue_missing_count > 0 || tr.summary.overdue_failed_count > 0
      })
    }

    // Only include group if it has tool rows after filtering
    if (filteredTools.length === 0) continue

    result.push({
      search_version: first.search_version,
      product: first.product,
      group_name: first.group_name,
      lan: first.lan,
      source_type: first.source_type,
      data_type: first.data_type,
      tools: filteredTools,
    })
  }

  return result
}

/**
 * Compute overview statistics from grouped data.
 *
 * @param {import('./types.js').Group[]} groups
 * @returns {import('./types.js').OverviewStats}
 */
export function getOverviewStats(groups) {
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

/**
 * Get MissingFile records for a summary, optionally filtered by status and/or sub_group.
 *
 * @param {number} summaryId
 * @param {{ status?: string, sub_group?: string, is_overdue?: boolean }} [filter]
 * @returns {import('./types.js').MissingFile[]}
 */
export function getMissingFiles(summaryId, filter) {
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
