// @ts-check

// ─── Legacy types (used by sample-data.js mock builder) ─────────────────────

/**
 * @typedef {Object} Task
 * @property {number} task_id
 * @property {string} search_version
 * @property {string} product
 * @property {string} group_name
 * @property {string} lan
 * @property {string} source_type
 * @property {string} data_type
 * @property {string} tool_name
 * @property {number} is_active
 */

/**
 * @typedef {Object} LegacySubGroupSummary
 * @property {string} sub_group_name
 * @property {number} missing_count
 * @property {number} failed_count
 * @property {number} overdue_missing_count
 * @property {number} overdue_failed_count
 * @property {number} remapped_count
 * @property {number} shielded_count
 */

/**
 * @typedef {Object} LegacySummary
 * @property {number} summary_id
 * @property {number} task_id
 * @property {number} passed_count
 * @property {number} missing_count
 * @property {number} failed_count
 * @property {number} overdue_missing_count
 * @property {number} overdue_failed_count
 * @property {number} remapped_count
 * @property {number} shielded_count
 * @property {string} report_url
 * @property {string} scan_time
 * @property {string} create_time
 * @property {number} is_active
 * @property {LegacySubGroupSummary[]} sub_groups
 */

// ─── Backend-aligned types ───────────────────────────────────────────────────

/**
 * A sub-group within a summary item, matching backend response format.
 * @typedef {Object} SubGroup
 * @property {string} group_name
 * @property {number} missed
 * @property {number} failed
 * @property {number} overdue_missed
 * @property {number} overdue_failed
 */

/**
 * A summary item for one tool within a group, matching backend response format.
 * When summary_id is -1 and all counts are -1, the tool is "unscanned".
 * @typedef {Object} SummaryItem
 * @property {number} summary_id
 * @property {string} tool_name
 * @property {number} passed
 * @property {number} missed
 * @property {number} failed
 * @property {number} shielded
 * @property {number} remapped
 * @property {number} overdue_missed
 * @property {number} overdue_failed
 * @property {string} scan_time
 * @property {string} create_time
 * @property {string} report_url
 * @property {SubGroup[]} sub_groups
 */

/**
 * A group of summary items sharing the same dimension values.
 * Matches backend response format.
 * @typedef {Object} Group
 * @property {string} search_version
 * @property {string} c_version
 * @property {string} data_type
 * @property {string} source_type
 * @property {string} lan
 * @property {string} product
 * @property {string} [group_name]
 * @property {SummaryItem[]} summarys
 */

// ─── Shared types (used by both old and new code paths) ──────────────────────

/**
 * @typedef {Object} MissingFile
 * @property {number} missing_file_id
 * @property {number} summary_id
 * @property {string} file_name
 * @property {string} status - 'missing'|'failed'|'remapped'|'shielded'
 * @property {string|null} sub_group
 * @property {string} first_detected_time
 * @property {number} is_overdue - 0 or 1
 */

/**
 * @typedef {Object} OverviewStats
 * @property {number} totalTasks
 * @property {number} noResultTasks
 * @property {number} hasMissingTasks
 * @property {number} hasExpiredMissingTasks
 */

/**
 * @typedef {Object} Filters
 * @property {string} search_version
 * @property {string} group_name
 * @property {string} product
 * @property {string} source_type
 * @property {string} lan
 * @property {string} data_type
 * @property {string} tool_name
 * @property {string[]} task_status
 */

export {}
