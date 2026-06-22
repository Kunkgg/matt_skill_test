"""API 契约集成测试：验证 GET /api/missing-file/summary 的对外 JSON 契约。

使用 seed 演示数据 + test client，只测对外 HTTP 契约，不测内部实现细节。
（测试接缝：主接缝 = API 契约集成测试，见 PRD Testing Decisions。）
"""

import pytest

pytestmark = pytest.mark.django_db


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


def _api(client, **params):
    """调总览接口，作基础断言，返回 data 数组。"""
    r = client.get("/api/missing-file/summary", data=params)
    assert r.status_code == 200
    body = r.json()
    assert body["code"] == 0
    assert body["message"] == "success"
    return body["data"]


def _find_group(data, group_name):
    return next(g for g in data if g["group_name"] == group_name)


# ---------------------------------------------------------------------------
# 外层响应结构
# ---------------------------------------------------------------------------


class TestResponseWrapper:
    def test_code_message_data_keys(self, client):
        r = client.get("/api/missing-file/summary")
        assert r.status_code == 200
        body = r.json()
        assert sorted(body.keys()) == ["code", "data", "message"]
        assert body["code"] == 0
        assert isinstance(body["data"], list)

    def test_excludes_inactive_tasks(self, client):
        """seed 中 legacy_tool 的 is_active=False，应被排除。"""
        data = _api(client)
        for g in data:
            all_tools = [s["tool_name"] for s in g["summarys"]]
            assert "legacy_tool" not in all_tools, (
                f"group {g['group_name']}不应包含禁用的 legacy_tool"
            )


# ---------------------------------------------------------------------------
# Group 聚合
# ---------------------------------------------------------------------------


class TestGroupAggregation:
    def test_groups_by_six_dimensions(self, client):
        """同一 Group 的不同 tool 归在同一 group 下。"""
        data = _api(client)
        # 29A/核心网 有 codestyle + secbrella 两个 tool（28B 只有一个）
        core = next(g for g in data if g["group_name"] == "核心网" and g["search_version"] == "29A")
        tools = {s["tool_name"] for s in core["summarys"]}
        assert tools == {"codestyle", "secbrella"}

    def test_different_versions_create_different_groups(self, client):
        """search_version 不同 → 不同 Group。"""
        data = _api(client)
        core_groups = [g for g in data if g["group_name"] == "核心网"]
        assert len(core_groups) == 2  # 28B + 29A
        versions = {g["search_version"] for g in core_groups}
        assert versions == {"28B", "29A"}

    def test_group_has_all_six_dimension_fields(self, client):
        for g in _api(client):
            for dim in (
                "search_version",
                "product",
                "group_name",
                "lan",
                "source_type",
                "data_type",
            ):
                assert dim in g, f"Group 缺少维度 {dim}"

    def test_query_filter_by_product(self, client):
        data = _api(client, product="5G")
        assert len(data) > 0
        for g in data:
            assert g["product"] == "5G"

    def test_query_filter_by_tool(self, client):
        data = _api(client, tool_name="codestyle")
        for g in data:
            for s in g["summarys"]:
                assert s["tool_name"] == "codestyle"


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------


class TestSummaryFields:
    SUMMARY_FIELDS = (
        "summary_id",
        "tool_name",
        "passed_count",
        "missing_count",
        "failed_count",
        "overdue_missing_count",
        "overdue_failed_count",
        "remapped_count",
        "shielded_count",
        "report_url",
        "scan_time",
        "create_time",
        "sub_groups",
    )

    def test_summary_has_all_fields(self, client):
        s = _api(client)[0]["summarys"][0]
        for field in self.SUMMARY_FIELDS:
            assert field in s, f"summary 缺少字段 {field}"

    def test_each_tool_appears_once_per_group(self, client):
        """同一 Group 下每个 tool_name 只有一份 summary。"""
        for g in _api(client):
            tools = [s["tool_name"] for s in g["summarys"]]
            assert len(tools) == len(set(tools)), f"tool 重复：{tools}"


# ---------------------------------------------------------------------------
# Sub-groups（grilling Q4/Q5 结论）
# ---------------------------------------------------------------------------


class TestSubGroups:
    SUB_GROUP_KEYS = {
        "sub_group_name",
        "missing_count",
        "failed_count",
        "overdue_missing_count",
        "overdue_failed_count",
        "remapped_count",
        "shielded_count",
    }

    def test_no_passed_count_in_sub_groups(self, client):
        """sub_groups 元素没有 passed_count —— 从 missing_file 凑不出。"""
        for g in _api(client):
            for s in g["summarys"]:
                for sg in s["sub_groups"]:
                    assert "passed_count" not in sg, (
                        f"{g['group_name']}/{s['tool_name']}/{sg['sub_group_name']}"
                        "不应含 passed_count"
                    )

    def test_sub_group_keys_match_six_count_contract(self, client):
        """sub_group 对象恰好 7 个 key：sub_group_name + 6 count。"""
        for g in _api(client):
            for s in g["summarys"]:
                for sg in s["sub_groups"]:
                    assert set(sg.keys()) == self.SUB_GROUP_KEYS, (
                        f"keys={set(sg.keys())} ≠ {self.SUB_GROUP_KEYS}"
                    )

    def test_no_sub_group_structure_returns_empty_array(self, client):
        """「无线」不在 SUB_GROUP_REGISTRY → sub_groups 为空。"""
        wuxian = _find_group(_api(client), "无线")
        for s in wuxian["summarys"]:
            assert s["sub_groups"] == [], f"无线无子分组结构，应为 []，实际 {s['sub_groups']}"

    def test_registry_sub_groups_all_listed(self, client):
        """核心网 registry=[AMF,SMF,UPF] → 全部展开（含 0 缺失的 UPF）。"""
        core = _find_group(_api(client), "核心网")
        for s in core["summarys"]:
            names = [sg["sub_group_name"] for sg in s["sub_groups"]]
            assert names == ["AMF", "SMF", "UPF"], f"{s['tool_name']} 子分组清单不符：{names}"

    def test_sub_group_counts_are_nonnegative_ints(self, client):
        for g in _api(client):
            for s in g["summarys"]:
                for sg in s["sub_groups"]:
                    for key in self.SUB_GROUP_KEYS - {"sub_group_name"}:
                        val = sg[key]
                        assert isinstance(val, int), (
                            f"{sg['sub_group_name']}.{key} 不是 int: {type(val)}"
                        )
                        assert val >= 0
