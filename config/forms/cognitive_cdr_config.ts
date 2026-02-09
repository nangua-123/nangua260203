
import { FormConfig } from "../../types";

export const COGNITIVE_CDR_CONFIG: FormConfig = {
  id: "cdr_comprehensive",
  title: "临床痴呆评定量表 (CDR) - 双视角版",
  version: "WCH-CDR-2024",
  sections: [
    {
      id: "cdr_informant_view",
      title: "第一部分：知情者/家属访谈 (Informant)",
      fields: [
        {
            id: "inf_memory_group",
            type: "group",
            label: "记忆力评估",
            children: [
                {
                    id: "inf_mem_shop",
                    type: "choice",
                    label: "去商店买几样东西，能记住吗？",
                    options: [
                        { label: "完全能记住 (0)", value: 0 },
                        { label: "记住几样 (0.5)", value: 0.5 },
                        { label: "很难记住/需写清单 (1)", value: 1 }
                    ]
                },
                {
                    id: "inf_mem_events",
                    type: "choice",
                    label: "会忘记近几周的重要事情吗？(如家庭聚会/旅游)",
                    options: [
                        { label: "记得很清楚 (0)", value: 0 },
                        { label: "有些细节模糊 (0.5)", value: 0.5 },
                        { label: "完全忘记 (1)", value: 1 }
                    ]
                }
            ]
        },
        {
            id: "inf_orientation_group",
            type: "group",
            label: "定向力评估",
            children: [
                {
                    id: "inf_ori_time",
                    type: "choice",
                    label: "能否准确说出日期、月份、年份、星期？",
                    options: [
                        { label: "完全准确 (0)", value: 0 },
                        { label: "偶尔弄错 (0.5)", value: 0.5 },
                        { label: "经常不知道 (1)", value: 1 }
                    ]
                },
                {
                    id: "inf_ori_sequence",
                    type: "choice",
                    label: "能否准确判断事情发生的先后顺序？",
                    options: [
                        { label: "正常 (0)", value: 0 },
                        { label: "轻微混乱 (0.5)", value: 0.5 },
                        { label: "严重混乱 (1)", value: 1 }
                    ]
                },
                {
                    id: "inf_ori_street",
                    type: "choice",
                    label: "在熟悉的街道能找到路吗？",
                    options: [
                        { label: "没问题 (0)", value: 0 },
                        { label: "偶尔需要确认 (0.5)", value: 0.5 },
                        { label: "经常迷路 (1)", value: 1 }
                    ]
                }
            ]
        },
        {
            id: "inf_judgment_group",
            type: "group",
            label: "判断与解决问题",
            children: [
                {
                    id: "inf_jud_finance",
                    type: "choice",
                    label: "处理钱财的能力 (如购物找零钱)？",
                    options: [
                        { label: "独立处理 (0)", value: 0 },
                        { label: "有些困难/慢 (0.5)", value: 0.5 },
                        { label: "无法处理 (1)", value: 1 }
                    ]
                },
                {
                    id: "inf_jud_emergency",
                    type: "choice",
                    label: "遇到紧急情况 (如水管漏水/着火) 如何处理？",
                    options: [
                        { label: "能合理应对 (0)", value: 0 },
                        { label: "犹豫/不知所措 (0.5)", value: 0.5 },
                        { label: "无法应对/举止失当 (1)", value: 1 }
                    ]
                }
            ]
        },
        {
            id: "inf_care_group",
            type: "group",
            label: "个人生活自理",
            children: [
                {
                    id: "inf_care_dress",
                    type: "choice",
                    label: "穿衣能力 (如是否系错扣子、穿反)？",
                    options: [
                        { label: "完全自理 (0)", value: 0 },
                        { label: "偶尔出错/需提醒 (1)", value: 1 },
                        { label: "需大量协助 (2)", value: 2 }
                    ]
                },
                {
                    id: "inf_care_hygiene",
                    type: "choice",
                    label: "个人洗漱卫生？",
                    options: [
                        { label: "维持良好 (0)", value: 0 },
                        { label: "需督促 (1)", value: 1 },
                        { label: "需协助/拒绝洗澡 (2)", value: 2 }
                    ]
                },
                {
                    id: "inf_care_eat",
                    type: "choice",
                    label: "进食情况 (如是否只能用勺子)？",
                    options: [
                        { label: "正常使用餐具 (0)", value: 0 },
                        { label: "进食凌乱/只用勺 (1)", value: 1 },
                        { label: "需喂食 (2)", value: 2 }
                    ]
                },
                {
                    id: "inf_care_bowel",
                    type: "choice",
                    label: "二便控制？",
                    options: [
                        { label: "正常 (0)", value: 0 },
                        { label: "偶尔失禁 (1)", value: 1 },
                        { label: "经常失禁 (2)", value: 2 }
                    ]
                }
            ]
        }
      ]
    },
    {
      "id": "cdr_subject_view",
      "title": "第二部分：受试者认知测试 (Subject)",
      "fields": [
        {
            id: "sub_mem_recall",
            type: "group",
            label: "记忆回忆测试",
            children: [
                {
                    id: "sub_mem_event_recall",
                    type: "choice",
                    label: "请描述刚才家属提到的“最近一周/一月内”发生的那件具体事情？",
                    options: [
                        { label: "描述清晰准确 (0)", value: 0 },
                        { label: "仅记得部分/需提示 (0.5)", value: 0.5 },
                        { label: "完全不记得/虚构 (1)", value: 1 }
                    ]
                }
            ]
        },
        {
            id: "sub_reg_group",
            type: "group",
            label: "姓名地址记忆 (李-雷-北京市-金三角-28号)",
            children: [
                { id: "sub_reg_intro", type: "info", label: "请受试者跟着读一遍，然后尝试重复。共进行3次，记录每次正确数。" },
                {
                    id: "sub_reg_trial_1",
                    type: "number",
                    label: "第1次尝试正确数 (0-5)",
                    validation: { min: 0, max: 5 }
                },
                {
                    id: "sub_reg_trial_2",
                    type: "number",
                    label: "第2次尝试正确数 (0-5)",
                    validation: { min: 0, max: 5 }
                },
                {
                    id: "sub_reg_trial_3",
                    type: "number",
                    label: "第3次尝试正确数 (0-5)",
                    validation: { min: 0, max: 5 }
                }
            ]
        },
        {
            id: "sub_calc_group",
            type: "group",
            label: "计算力测试",
            children: [
                {
                    id: "sub_calc_money_1",
                    type: "choice",
                    label: "10元钱等于多少个5角？",
                    options: [
                        { label: "20个 (正确)", value: 0 },
                        { label: "错误", value: 1 }
                    ]
                },
                {
                    id: "sub_calc_money_2",
                    type: "choice",
                    label: "135元能换多少个5元？",
                    options: [
                        { label: "27个 (正确)", value: 0 },
                        { label: "错误", value: 1 }
                    ]
                }
            ]
        },
        {
            id: "sub_jud_group",
            type: "group",
            label: "判断力测试",
            children: [
                {
                    id: "sub_jud_similarity",
                    type: "choice",
                    label: "萝卜和芹菜有什么相似之处？",
                    options: [
                        { label: "都是蔬菜 (正确 0)", value: 0 },
                        { label: "都是吃的/长地里 (部分 1)", value: 1 },
                        { label: "颜色不同/不切题 (错误 2)", value: 2 }
                    ]
                }
            ]
        }
      ]
    }
  ]
};
