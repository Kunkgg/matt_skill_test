<template>
  <div class="dashboard">
    <h1 class="dashboard-title">缺失文件扫描结果看板</h1>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 错误 -->
    <el-alert
      v-else-if="error"
      type="error"
      :title="error"
      show-icon
      :closable="false"
    />

    <!-- 空数据 -->
    <el-empty v-else-if="groups.length === 0" description="暂无扫描数据" />

    <!-- 数据展示 -->
    <div v-else>
      <el-card
        v-for="(group, gIdx) in groups"
        :key="groupKey(group, gIdx)"
        class="group-card"
      >
        <template #header>
          <div class="group-header">
            <div class="group-dimensions">
              <el-tag type="primary">{{ group.product }}</el-tag>
              <el-tag type="success">{{ group.group_name }}</el-tag>
              <span class="dim-text">版本: {{ group.search_version }}</span>
              <span class="dim-text">语言: {{ group.lan }}</span>
              <span class="dim-text">源码: {{ group.source_type }}</span>
              <span class="dim-text">数据: {{ group.data_type }}</span>
            </div>
          </div>
        </template>

        <!-- 每个 Summary 作为独立区块，子分组内联渲染 -->
        <div
          v-for="summary in group.summarys"
          :key="summary.summary_id"
          class="summary-block"
        >
          <h3 class="summary-tool-name">{{ summary.tool_name }}</h3>

          <el-table :data="[summary]" border stripe style="width: 100%">
            <el-table-column
              prop="passed_count"
              label="通过"
              width="80"
              align="center"
            />
            <el-table-column
              prop="missing_count"
              label="缺失"
              width="80"
              align="center"
            >
              <template #default="{ row }">
                <span :class="{ 'count-danger': row.missing_count > 0 }">{{
                  row.missing_count
                }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="failed_count"
              label="失败"
              width="80"
              align="center"
            >
              <template #default="{ row }">
                <span :class="{ 'count-danger': row.failed_count > 0 }">{{
                  row.failed_count
                }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="overdue_missing_count"
              label="逾期缺失"
              width="100"
              align="center"
            >
              <template #default="{ row }">
                <span
                  :class="{ 'count-warn': row.overdue_missing_count > 0 }"
                  >{{ row.overdue_missing_count }}</span
                >
              </template>
            </el-table-column>
            <el-table-column
              prop="overdue_failed_count"
              label="逾期失败"
              width="100"
              align="center"
            >
              <template #default="{ row }">
                <span :class="{ 'count-warn': row.overdue_failed_count > 0 }">{{
                  row.overdue_failed_count
                }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="remapped_count"
              label="重映射"
              width="80"
              align="center"
            />
            <el-table-column
              prop="shielded_count"
              label="屏蔽"
              width="80"
              align="center"
            />
            <el-table-column label="扫描时间" width="180" align="center">
              <template #default="{ row }">
                {{ formatTime(row.scan_time) }}
              </template>
            </el-table-column>
            <el-table-column label="报告" width="80" align="center">
              <template #default="{ row }">
                <a v-if="row.report_url" :href="row.report_url" target="_blank"
                  >查看</a
                >
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>

          <!-- 子分组（内联渲染，无需点击展开） -->
          <div
            v-if="summary.sub_groups && summary.sub_groups.length > 0"
            class="sub-group-section"
          >
            <h4>子分组详情</h4>
            <el-table :data="summary.sub_groups" border size="small">
              <el-table-column
                prop="sub_group_name"
                label="子分组"
                width="160"
              />
              <el-table-column prop="missing_count" label="缺失" align="center">
                <template #default="{ row: sg }">
                  <span :class="{ 'count-danger': sg.missing_count > 0 }">{{
                    sg.missing_count
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="failed_count" label="失败" align="center">
                <template #default="{ row: sg }">
                  <span :class="{ 'count-danger': sg.failed_count > 0 }">{{
                    sg.failed_count
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="overdue_missing_count"
                label="逾期缺失"
                align="center"
              >
                <template #default="{ row: sg }">
                  <span
                    :class="{ 'count-warn': sg.overdue_missing_count > 0 }"
                    >{{ sg.overdue_missing_count }}</span
                  >
                </template>
              </el-table-column>
              <el-table-column
                prop="overdue_failed_count"
                label="逾期失败"
                align="center"
              >
                <template #default="{ row: sg }">
                  <span
                    :class="{ 'count-warn': sg.overdue_failed_count > 0 }"
                    >{{ sg.overdue_failed_count }}</span
                  >
                </template>
              </el-table-column>
              <el-table-column
                prop="remapped_count"
                label="重映射"
                align="center"
              />
              <el-table-column
                prop="shielded_count"
                label="屏蔽"
                align="center"
              />
            </el-table>
          </div>
          <div v-else class="no-sub-group">该组件组无子分组结构</div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const groups = ref([])
const loading = ref(true)
const error = ref('')

function groupKey(group, idx) {
  return `${group.product}-${group.group_name}-${group.search_version}-${idx}`
}

function formatTime(isoStr) {
  if (!isoStr) return '-'
  const d = new Date(isoStr)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function fetchSummary() {
  loading.value = true
  error.value = ''
  try {
    const res = await axios.get('/api/missing-file/summary')
    if (res.data.code === 0) {
      groups.value = res.data.data
    } else {
      error.value = res.data.message || '接口返回异常'
    }
  } catch (e) {
    error.value = e.message || '请求失败，请确认后端服务已启动'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSummary()
})
</script>

<style scoped>
.dashboard-title {
  font-size: 24px;
  margin-bottom: 24px;
  color: #303133;
}

.group-card {
  margin-bottom: 24px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.group-dimensions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dim-text {
  font-size: 13px;
  color: #909399;
}

.summary-block {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.summary-block:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.summary-tool-name {
  font-size: 16px;
  color: #303133;
  margin: 0 0 12px 0;
}

.count-danger {
  color: #f56c6c;
  font-weight: bold;
}

.count-warn {
  color: #e6a23c;
  font-weight: bold;
}

.sub-group-section {
  margin-top: 16px;
}

.sub-group-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
}

.no-sub-group {
  margin-top: 12px;
  color: #909399;
  font-size: 13px;
}

.loading-container {
  min-height: 400px;
}
</style>
