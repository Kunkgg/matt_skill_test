// @ts-check
// Deterministic sample data for the Missing File Scan Dashboard.
// Uses a builder pattern: tasks → summaries → missingFiles → recount summaries.

// ─── Seed helpers ────────────────────────────────────────────────────────────

/** Deterministic pseudo-hash for generating IDs */
function seedInt(seed, max) {
  // Simple deterministic hash based on string char codes
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0
  }
  return ((h < 0 ? -h : h) % max)
}

// ─── Configuration constants ─────────────────────────────────────────────────

const TOOL_NAMES = [
  'codetyle', 'codemars', 'secbrella', 'aps-molint',
  'cooddy', 'binexplorer', 'sai', 'secoptions',
]

const SUB_GROUPS = ['BSP', 'TRAN', 'APP', 'TEST', 'TOOLS']

const STATUSES = ['missing', 'failed', 'remapped', 'shielded']

const FILE_EXTENSIONS = { python: '.py', clike: '.c', java: '.java', go: '.go' }

const GROUP_CONFIGS = [
  { search_version: 'V100R001', product: '4G', group_name: 'OAM-PLATFORM', lan: 'python', source_type: 'bsdiy', data_type: '全量源码级' },
  { search_version: 'V100R001', product: '5G', group_name: 'CORE-NETWORK', lan: 'clike', source_type: 'adapt', data_type: '版本级' },
  { search_version: 'V100R002', product: 'IAB', group_name: 'TRANSPORT', lan: 'java', source_type: 'self_dev', data_type: '全量源码级' },
  { search_version: 'V100R002', product: 'EMRU', group_name: 'RADIO-ACCESS', lan: 'go', source_type: 'self_tool', data_type: '版本级' },
  { search_version: 'V100R003', product: '5G', group_name: 'OAM-PLATFORM', lan: 'python', source_type: 'bsdiy', data_type: '全量源码级' },
  { search_version: 'V100R003', product: '4G', group_name: 'TRANSPORT', lan: 'clike', source_type: 'adapt', data_type: '版本级' },
]

// Tools that will have NO summary (represent '未扫描')
// Use deterministic indices per group
const NO_SUMMARY_TOOL_INDICES = [
  [6, 7],    // group 0: sai, secoptions have no summary
  [5, 7],    // group 1: binexplorer, secoptions
  [4, 6],    // group 2: cooddy, sai
  [3, 7],    // group 3: aps-molint, secoptions
  [5, 6],    // group 4: binexplorer, sai
  [6, 7],    // group 5: sai, secoptions
]

// Deterministic file counts per (group, tool, sub_group) – these drive MissingFile generation
// Pattern: [missing, failed, remapped, shielded] counts for each sub_group
// We'll generate a compact matrix and expand it.

/**
 * Returns deterministic file distribution for a given group+tool combo.
 * @param {number} groupIdx
 * @param {number} toolIdx
 * @returns {Array<{sub_group: string, missing: number, failed: number, remapped: number, shielded: number, overdue_missing: number, overdue_failed: number}>}
 */
function getFileDistribution(groupIdx, toolIdx) {
  // Base counts derived deterministically from indices
  const base = (groupIdx * 8 + toolIdx) % 17
  const results = []

  for (let s = 0; s < SUB_GROUPS.length; s++) {
    const v = (base + s * 3 + groupIdx + toolIdx) % 11
    // Only some sub_groups have files (keep data sparse but realistic)
    if (v < 3) {
      results.push({
        sub_group: SUB_GROUPS[s],
        missing: 0, failed: 0, remapped: 0, shielded: 0,
        overdue_missing: 0, overdue_failed: 0,
      })
      continue
    }

    const missing = v > 5 ? (v - 3) : (v > 3 ? 1 : 0)
    const failed = v > 7 ? (v - 6) : (v > 4 ? 1 : 0)
    const remapped = v > 6 ? 1 : 0
    const shielded = v > 8 ? 1 : 0
    const overdue_missing = missing > 1 ? 1 : 0
    const overdue_failed = failed > 1 ? 1 : 0

    results.push({
      sub_group: SUB_GROUPS[s],
      missing, failed, remapped, shielded,
      overdue_missing, overdue_failed,
    })
  }

  return results
}

// ─── Build tasks ─────────────────────────────────────────────────────────────

/** @type {import('./types.js').Task[]} */
const tasks = []
let taskIdCounter = 1000

for (let g = 0; g < GROUP_CONFIGS.length; g++) {
  const cfg = GROUP_CONFIGS[g]
  for (let t = 0; t < TOOL_NAMES.length; t++) {
    tasks.push({
      task_id: taskIdCounter++,
      search_version: cfg.search_version,
      product: cfg.product,
      group_name: cfg.group_name,
      lan: cfg.lan,
      source_type: cfg.source_type,
      data_type: cfg.data_type,
      tool_name: TOOL_NAMES[t],
      is_active: 1,
    })
  }
}

// ─── Build summaries and missingFiles ────────────────────────────────────────

/** @type {import('./types.js').Summary[]} */
const summaries = []

/** @type {import('./types.js').MissingFile[]} */
const missingFiles = []

let summaryIdCounter = 2000
let missingFileIdCounter = 5000

for (let g = 0; g < GROUP_CONFIGS.length; g++) {
  const cfg = GROUP_CONFIGS[g]
  const ext = FILE_EXTENSIONS[cfg.lan] || '.txt'
  const noSummarySet = new Set(NO_SUMMARY_TOOL_INDICES[g])

  for (let t = 0; t < TOOL_NAMES.length; t++) {
    // Find the matching task
    const task = tasks.find(
      (tk) =>
        tk.search_version === cfg.search_version &&
        tk.product === cfg.product &&
        tk.group_name === cfg.group_name &&
        tk.tool_name === TOOL_NAMES[t],
    )
    if (!task) continue

    // Skip tools marked as '未扫描'
    if (noSummarySet.has(t)) continue

    const summaryId = summaryIdCounter++
    const distribution = getFileDistribution(g, t)

    // Generate MissingFile records from distribution
    /** @type {import('./types.js').MissingFile[]} */
    const filesForSummary = []

    for (const dist of distribution) {
      const sgLower = dist.sub_group.toLowerCase()
      let fileCounter = 1

      // Missing files
      for (let i = 0; i < dist.missing; i++) {
        const isOverdue = i < dist.overdue_missing ? 1 : 0
        filesForSummary.push({
          missing_file_id: missingFileIdCounter++,
          summary_id: summaryId,
          file_name: `${cfg.group_name.toLowerCase()}/${sgLower}/drivers/module_${fileCounter}/source_${fileCounter}${ext}`,
          status: 'missing',
          sub_group: dist.sub_group,
          first_detected_time: `2026-06-${String(10 + ((g + t + fileCounter) % 18)).padStart(2, '0')}T08:${String(10 + (fileCounter % 50)).padStart(2, '0')}:00Z`,
          is_overdue: isOverdue,
        })
        fileCounter++
      }

      // Failed files
      for (let i = 0; i < dist.failed; i++) {
        const isOverdue = i < dist.overdue_failed ? 1 : 0
        filesForSummary.push({
          missing_file_id: missingFileIdCounter++,
          summary_id: summaryId,
          file_name: `${cfg.group_name.toLowerCase()}/${sgLower}/core/module_${fileCounter}/handler_${fileCounter}${ext}`,
          status: 'failed',
          sub_group: dist.sub_group,
          first_detected_time: `2026-06-${String(11 + ((g + t + fileCounter) % 17)).padStart(2, '0')}T09:${String(15 + (fileCounter % 45)).padStart(2, '0')}:00Z`,
          is_overdue: isOverdue,
        })
        fileCounter++
      }

      // Remapped files
      for (let i = 0; i < dist.remapped; i++) {
        filesForSummary.push({
          missing_file_id: missingFileIdCounter++,
          summary_id: summaryId,
          file_name: `${cfg.group_name.toLowerCase()}/${sgLower}/adapters/module_${fileCounter}/bridge_${fileCounter}${ext}`,
          status: 'remapped',
          sub_group: dist.sub_group,
          first_detected_time: `2026-06-${String(12 + ((g + t + fileCounter) % 16)).padStart(2, '0')}T10:${String(20 + (fileCounter % 40)).padStart(2, '0')}:00Z`,
          is_overdue: 0,
        })
        fileCounter++
      }

      // Shielded files
      for (let i = 0; i < dist.shielded; i++) {
        filesForSummary.push({
          missing_file_id: missingFileIdCounter++,
          summary_id: summaryId,
          file_name: `${cfg.group_name.toLowerCase()}/${sgLower}/utils/module_${fileCounter}/helper_${fileCounter}${ext}`,
          status: 'shielded',
          sub_group: dist.sub_group,
          first_detected_time: `2026-06-${String(13 + ((g + t + fileCounter) % 15)).padStart(2, '0')}T11:${String(25 + (fileCounter % 35)).padStart(2, '0')}:00Z`,
          is_overdue: 0,
        })
        fileCounter++
      }
    }

    missingFiles.push(...filesForSummary)

    // Compute summary counts FROM the actual MissingFile records
    const missing_count = filesForSummary.filter((f) => f.status === 'missing').length
    const failed_count = filesForSummary.filter((f) => f.status === 'failed').length
    const remapped_count = filesForSummary.filter((f) => f.status === 'remapped').length
    const shielded_count = filesForSummary.filter((f) => f.status === 'shielded').length
    const overdue_missing_count = filesForSummary.filter((f) => f.status === 'missing' && f.is_overdue === 1).length
    const overdue_failed_count = filesForSummary.filter((f) => f.status === 'failed' && f.is_overdue === 1).length

    // Passed count: deterministic based on group+tool
    const passed_count = 50 + seedInt(`${g}-${t}-passed`, 200)

    // Build sub_groups summary from files
    /** @type {import('./types.js').SubGroupSummary[]} */
    const sub_groups = []
    for (const dist of distribution) {
      if (dist.missing + dist.failed + dist.remapped + dist.shielded > 0) {
        sub_groups.push({
          sub_group_name: dist.sub_group,
          missing_count: dist.missing,
          failed_count: dist.failed,
          overdue_missing_count: dist.overdue_missing,
          overdue_failed_count: dist.overdue_failed,
          remapped_count: dist.remapped,
          shielded_count: dist.shielded,
        })
      }
    }

    // Scan time: deterministic per summary
    const dayOffset = (g * 3 + t * 2) % 20
    const hourOffset = (g + t * 3) % 24
    const scanTime = `2026-06-${String(8 + dayOffset).padStart(2, '0')}T${String(hourOffset).padStart(2, '0')}:30:00Z`
    const createTime = `2026-06-${String(8 + dayOffset).padStart(2, '0')}T${String(hourOffset).padStart(2, '0')}:35:00Z`

    summaries.push({
      summary_id: summaryId,
      task_id: task.task_id,
      passed_count,
      missing_count,
      failed_count,
      overdue_missing_count,
      overdue_failed_count,
      remapped_count,
      shielded_count,
      report_url: `https://reports.example.com/scan/${summaryId}`,
      scan_time: scanTime,
      create_time: createTime,
      is_active: 1,
      sub_groups,
    })
  }
}

export { tasks, summaries, missingFiles }
