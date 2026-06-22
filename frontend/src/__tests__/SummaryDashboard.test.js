import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import ElementPlus from 'element-plus'
import SummaryDashboard from '../components/SummaryDashboard.vue'

vi.mock('axios')

// 与后端接口契约对齐的 mock 数据
const mockResponse = {
  code: 0,
  message: 'success',
  data: [
    {
      search_version: 'v1.0',
      product: '核心网',
      group_name: '5GC',
      lan: 'C++',
      source_type: 'source',
      data_type: 'code',
      summarys: [
        {
          summary_id: 1,
          tool_name: 'Coverity',
          passed_count: 100,
          missing_count: 3,
          failed_count: 1,
          overdue_missing_count: 2,
          overdue_failed_count: 0,
          remapped_count: 0,
          shielded_count: 1,
          report_url: 'http://example.com/report/1',
          scan_time: '2026-06-20T10:00:00',
          create_time: '2026-06-20T10:30:00',
          sub_groups: [
            {
              sub_group_name: 'AMF',
              missing_count: 2,
              failed_count: 0,
              overdue_missing_count: 1,
              overdue_failed_count: 0,
              remapped_count: 0,
              shielded_count: 0,
            },
            {
              sub_group_name: 'SMF',
              missing_count: 0,
              failed_count: 1,
              overdue_missing_count: 0,
              overdue_failed_count: 0,
              remapped_count: 0,
              shielded_count: 0,
            },
            {
              sub_group_name: 'UPF',
              missing_count: 1,
              failed_count: 0,
              overdue_missing_count: 1,
              overdue_failed_count: 0,
              remapped_count: 0,
              shielded_count: 1,
            },
          ],
        },
      ],
    },
  ],
}

// 无子分组的 mock（sub_groups = []）
const mockNoSubGroups = {
  code: 0,
  message: 'success',
  data: [
    {
      search_version: 'v2.0',
      product: '接入网',
      group_name: 'RAN',
      lan: 'Python',
      source_type: 'binary',
      data_type: 'config',
      summarys: [
        {
          summary_id: 2,
          tool_name: 'BlackDuck',
          passed_count: 50,
          missing_count: 0,
          failed_count: 0,
          overdue_missing_count: 0,
          overdue_failed_count: 0,
          remapped_count: 0,
          shielded_count: 0,
          report_url: null,
          scan_time: '2026-06-19T08:00:00',
          create_time: '2026-06-19T08:30:00',
          sub_groups: [],
        },
      ],
    },
  ],
}

// 挂载配置：安装 Element Plus 插件以支持 el-* 组件
const mountOptions = {
  global: {
    plugins: [ElementPlus],
  },
}

describe('SummaryDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('渲染加载态（初始 skeleton）', async () => {
    // 永不 resolve 的 promise，让 loading 保持 true
    axios.get.mockReturnValue(new Promise(() => {}))
    const wrapper = mount(SummaryDashboard, mountOptions)
    await flushPromises()
    expect(wrapper.find('.el-skeleton').exists()).toBe(true)
  })

  it('请求成功时渲染 Group 六维 + Summary + Sub-group', async () => {
    axios.get.mockResolvedValue({ data: mockResponse })
    const wrapper = mount(SummaryDashboard, mountOptions)

    // 等待 axios promise + Vue 重渲染
    await flushPromises()

    const text = wrapper.text()

    // Group 六维度
    expect(text).toContain('核心网')
    expect(text).toContain('5GC')
    expect(text).toContain('C++')
    expect(text).toContain('v1.0')
    expect(text).toContain('source')
    expect(text).toContain('code')

    // Summary 工具名 + 计数
    expect(text).toContain('Coverity')
    expect(text).toContain('100') // passed_count
    expect(text).toContain('3') // missing_count

    // Sub-group 子分组名
    expect(text).toContain('AMF')
    expect(text).toContain('SMF')
    expect(text).toContain('UPF')
  })

  it('无子分组时渲染"无子分组结构"文案', async () => {
    axios.get.mockResolvedValue({ data: mockNoSubGroups })
    const wrapper = mount(SummaryDashboard, mountOptions)

    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('接入网')
    expect(text).toContain('RAN')
    expect(text).toContain('BlackDuck')
    expect(text).toContain('无子分组结构')
  })

  it('网络错误时渲染错误态', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'))
    const wrapper = mount(SummaryDashboard, mountOptions)

    await flushPromises()

    expect(wrapper.find('.el-alert').exists()).toBe(true)
    expect(wrapper.vm.error).toBeTruthy()
  })

  it('接口返回非 0 code 时显示 message', async () => {
    axios.get.mockResolvedValue({
      data: { code: -1, message: '内部错误', data: [] },
    })
    const wrapper = mount(SummaryDashboard, mountOptions)

    await flushPromises()

    expect(wrapper.vm.error).toBe('内部错误')
  })

  it('空数据时渲染 empty 态', async () => {
    axios.get.mockResolvedValue({
      data: { code: 0, message: 'success', data: [] },
    })
    const wrapper = mount(SummaryDashboard, mountOptions)

    await flushPromises()

    expect(wrapper.find('.el-empty').exists()).toBe(true)
  })
})
