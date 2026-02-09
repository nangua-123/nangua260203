
import { FormConfig } from "../../types";

export const COGNITIVE_ADL_CONFIG: FormConfig = {
  id: "adl_iadl_combined",
  title: "日常生活能力评估 (ADL/IADL)",
  version: "WCH-Standard",
  sections: [
    {
      id: "barthel_adl",
      title: "一、Barthel 指数 (ADL)",
      description: "评估患者基本的自我照护能力 (总分100)",
      fields: [
        { 
            id: "adl_feeding", type: "choice", label: "进食", 
            options: [
                {label: "完全独立 (10)", value: 10}, 
                {label: "需部分帮助 (5)", value: 5}, 
                {label: "完全依赖 (0)", value: 0}
            ] 
        },
        { 
            id: "adl_bathing", type: "choice", label: "洗澡", 
            options: [
                {label: "完全独立 (5)", value: 5}, 
                {label: "需帮助 (0)", value: 0}
            ] 
        },
        { 
            id: "adl_grooming", type: "choice", label: "修饰 (洗脸/梳头/刷牙)", 
            options: [
                {label: "完全独立 (5)", value: 5}, 
                {label: "需帮助 (0)", value: 0}
            ] 
        },
        { 
            id: "adl_dressing", type: "choice", label: "穿衣", 
            options: [
                {label: "完全独立 (10)", value: 10}, 
                {label: "需部分帮助 (5)", value: 5}, 
                {label: "完全依赖 (0)", value: 0}
            ] 
        },
        { 
            id: "adl_bowel", type: "choice", label: "控制大便", 
            options: [
                {label: "完全自控 (10)", value: 10}, 
                {label: "偶尔失禁 (5)", value: 5}, 
                {label: "失禁/昏迷 (0)", value: 0}
            ] 
        },
        { 
            id: "adl_bladder", type: "choice", label: "控制小便", 
            options: [
                {label: "完全自控 (10)", value: 10}, 
                {label: "偶尔失禁 (5)", value: 5}, 
                {label: "失禁/昏迷 (0)", value: 0}
            ] 
        },
        { 
            id: "adl_toilet", type: "choice", label: "上厕所", 
            options: [
                {label: "完全独立 (10)", value: 10}, 
                {label: "需部分帮助 (5)", value: 5}, 
                {label: "完全依赖 (0)", value: 0}
            ] 
        },
        { 
            id: "adl_transfer", type: "choice", label: "床椅转移", 
            options: [
                {label: "完全独立 (15)", value: 15}, 
                {label: "需小量帮助 (10)", value: 10}, 
                {label: "需大量帮助 (5)", value: 5}, 
                {label: "完全依赖 (0)", value: 0}
            ] 
        },
        { 
            id: "adl_mobility", type: "choice", label: "平地行走", 
            options: [
                {label: "独立行走45米 (15)", value: 15}, 
                {label: "需帮助行走45米 (10)", value: 10}, 
                {label: "需轮椅推行 (5)", value: 5}, 
                {label: "完全卧床 (0)", value: 0}
            ] 
        },
        { 
            id: "adl_stairs", type: "choice", label: "上下楼梯", 
            options: [
                {label: "完全独立 (10)", value: 10}, 
                {label: "需帮助 (5)", value: 5}, 
                {label: "无法进行 (0)", value: 0}
            ] 
        }
      ]
    },
    {
      id: "lawton_iadl",
      title: "二、Lawton 量表 (IADL)",
      description: "评估工具性日常生活能力 (每项 0-1分)",
      fields: [
        { id: "iadl_phone", type: "choice", label: "使用电话的能力", options: [{label: "独立使用 (1)", value: 1}, {label: "不能使用 (0)", value: 0}] },
        { id: "iadl_shopping", type: "choice", label: "购物", options: [{label: "独立完成 (1)", value: 1}, {label: "不能完成 (0)", value: 0}] },
        { id: "iadl_food", type: "choice", label: "备餐", options: [{label: "独立完成 (1)", value: 1}, {label: "不能完成 (0)", value: 0}] },
        { id: "iadl_housework", type: "choice", label: "整理家务", options: [{label: "独立完成 (1)", value: 1}, {label: "不能完成 (0)", value: 0}] },
        { id: "iadl_laundry", type: "choice", label: "洗衣", options: [{label: "独立完成 (1)", value: 1}, {label: "不能完成 (0)", value: 0}] },
        { id: "iadl_transport", type: "choice", label: "使用交通工具", options: [{label: "独立旅行 (1)", value: 1}, {label: "不能旅行 (0)", value: 0}] },
        { id: "iadl_meds", type: "choice", label: "个人服药", options: [{label: "按时按量 (1)", value: 1}, {label: "不能 (0)", value: 0}] },
        { id: "iadl_finance", type: "choice", label: "理财能力", options: [{label: "独立管理 (1)", value: 1}, {label: "不能管理 (0)", value: 0}] }
      ]
    }
  ]
};
