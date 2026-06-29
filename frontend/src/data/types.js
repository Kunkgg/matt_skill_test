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
 * @typedef {Object} SubGroupSummary
 * @property {string} sub_group_name
 * @property {number} missing_count
 * @property {number} failed_count
 * @property {number} overdue_missing_count
 * @property {number} overdue_failed_count
 * @property {number} remapped_count
 * @property {number} shielded_count
 */

/**
 * @typedef {Object} Summary
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
 * @property {SubGroupSummary[]} sub_groups
 */

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
 * @typedef {Object} Group
 * @property {string} search_version
 * @property {string} product
 * @property {string} group_name
 * @property {string} lan
 * @property {string} source_type
 * @property {string} data_type
 * @property {ToolRow[]} tools
 */

/**
 * @typedef {Object} ToolRow
 * @property {string} tool_name
 * @property {Summary|null} summary
 * @property {SubGroupSummary[]} sub_groups
 * @property {MissingFile[]} missingFiles
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
