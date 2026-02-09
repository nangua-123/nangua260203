
import { FormConfig } from "../../types";

export const COGNITIVE_CDR_INFORMANT_CONFIG: FormConfig = {
  id: "cdr_informant_full",
  title: "CDR 临床痴呆评定 - 知情者访谈",
  version: "WCH-CDR-2024-Informant",
  sections: [
    {
      id: "cdr_inf_memory",
      title: "一、记忆力 (Memory)",
      description: "请评估受试者在日常生活中的记忆表现",
      fields: [
        {
            id: "inf_mem_decline",
            type: "choice",
            label: "1. 是否有经常性的记忆减退或思考困难？",
            options: [
                { label: "无记忆减退 (0)", value: 0 },
                { label: "轻微/可疑 (0.5)", value: 0.5 },
                { label: "有，且影响生活 (1)", value: 1 },
                { label: "严重记忆减退 (2)", value: 2 },
                { label: "完全丧失记忆 (3)", value: 3 }
            ]
        },
        {
            id: "inf_mem_shopping",
            type: "choice",
            label: "2. 去商店买几样东西（近事遗忘），能记住吗？",
            options: [
                { label: "完全能记住 (0)", value: 0 },
                { label: "偶尔忘记1-2样 (0.5)", value: 0.5 },
                { label: "很难记住/必须依赖清单 (1)", value: 1 },
                { label: "完全记不住/需他人代买 (2)", value: 2 },
                { label: "无法参与购物 (3)", value: 3 }
            ]
        },
        {
            id: "inf_mem_recent_event",
            type: "choice",
            label: "3. 会忘记数周前的重要社交事件细节吗（远事遗忘）？",
            options: [
                { label: "记得很清楚 (0)", value: 0 },
                { label: "有些细节模糊 (0.5)", value: 0.5 },
                { label: "基本忘记 (1)", value: 1 },
                { label: "完全无印象 (2)", value: 2 },
                { label: "无任何近期记忆 (3)", value: 3 }
            ]
        },
        {
            id: "inf_mem_old",
            type: "choice",
            label: "4. 更早以前的事件（如生日、结婚日期、家乡）能记得吗？",
            options: [
                { label: "完全记得 (0)", value: 0 },
                { label: "部分细节遗忘 (0.5)", value: 0.5 },
                { label: "主要过去事件遗忘 (1)", value: 1 },
                { label: "仅存零星片段 (2)", value: 2 },
                { label: "完全遗忘 (3)", value: 3 }
            ]
        },
        {
            id: "inf_mem_validation_week",
            type: "text",
            label: "【关键验证】请描述一件最近一周内发生的具体事情",
            hint: "例如：谁来探望过、去哪里吃过饭、发生了什么小意外。此信息将用于稍后询问患者进行核对。",
            validation: { required: true }
        },
        {
            id: "inf_mem_validation_month",
            type: "text",
            label: "【关键验证】请描述一件最近一月内发生的具体事情",
            hint: "例如：家庭聚会、旅游、就医经历。",
            validation: { required: true }
        }
      ]
    },
    {
      id: "cdr_inf_orientation",
      title: "二、定向力 (Orientation)",
      fields: [
        {
            id: "inf_ori_time",
            type: "choice",
            label: "1. 能否准确说出日期、月份、年份、星期？",
            options: [
                { label: "完全准确 (0)", value: 0 },
                { label: "偶尔弄错日期 (0.5)", value: 0.5 },
                { label: "经常弄错月份/年份 (1)", value: 1 },
                { label: "完全不知道时间 (2)", value: 2 },
                { label: "无时间概念 (3)", value: 3 }
            ]
        },
        {
            id: "inf_ori_sequence",
            type: "choice",
            label: "2. 能否准确判断事情发生的先后顺序？",
            options: [
                { label: "正常 (0)", value: 0 },
                { label: "轻微混乱 (0.5)", value: 0.5 },
                { label: "中度困难 (1)", value: 1 },
                { label: "严重混乱 (2)", value: 2 },
                { label: "完全无法判断 (3)", value: 3 }
            ]
        },
        {
            id: "inf_ori_street",
            type: "choice",
            label: "3. 在熟悉的街道能找到路吗？",
            options: [
                { label: "没问题 (0)", value: 0 },
                { label: "偶尔需要确认 (0.5)", value: 0.5 },
                { label: "经常迷路/需陪伴 (1)", value: 1 },
                { label: "只能去极熟悉的地方 (2)", value: 2 },
                { label: "完全不能出门 (3)", value: 3 }
            ]
        },
        {
            id: "inf_ori_outside",
            type: "choice",
            label: "4. 在家以外的其他地方导航能力如何？",
            options: [
                { label: "正常 (0)", value: 0 },
                { label: "轻微受损 (0.5)", value: 0.5 },
                { label: "需人带领 (1)", value: 1 },
                { label: "通常迷失方向 (2)", value: 2 },
                { label: "完全迷失 (3)", value: 3 }
            ]
        },
        {
            id: "inf_ori_inside",
            type: "choice",
            label: "5. 在家中熟悉室内寻路情况？",
            options: [
                { label: "完全正常 (0)", value: 0 },
                { label: "无 (0.5)", value: 0.5 }, 
                { label: "无 (1)", value: 1 },
                { label: "偶尔搞错房间 (2)", value: 2 },
                { label: "经常找不到厕所/卧室 (3)", value: 3 }
            ]
        }
      ]
    },
    {
      id: "cdr_inf_judgment",
      title: "三、判断与解决问题 (Judgment & Problem Solving)",
      fields: [
        {
            id: "inf_jud_general",
            type: "choice",
            label: "1. 解决日常问题的总体能力？",
            options: [
                { label: "良好 (0)", value: 0 },
                { label: "轻微受损 (0.5)", value: 0.5 },
                { label: "中度受损 (1)", value: 1 },
                { label: "严重受损 (2)", value: 2 },
                { label: "完全丧失 (3)", value: 3 }
            ]
        },
        {
            id: "inf_jud_small_money",
            type: "choice",
            label: "2. 处理少量钱财（如购物换零钱）的能力？",
            options: [
                { label: "独立处理 (0)", value: 0 },
                { label: "偶尔算错 (0.5)", value: 0.5 },
                { label: "经常算错/需帮助 (1)", value: 1 },
                { label: "无法处理 (2)", value: 2 },
                { label: "无概念 (3)", value: 3 }
            ]
        },
        {
            id: "inf_jud_bills",
            type: "choice",
            label: "3. 处理复杂财务或账单的能力？",
            options: [
                { label: "正常 (0)", value: 0 },
                { label: "有些困难 (0.5)", value: 0.5 },
                { label: "无法独立完成 (1)", value: 1 },
                { label: "完全无法参与 (2)", value: 2 },
                { label: "无概念 (3)", value: 3 }
            ]
        },
        {
            id: "inf_jud_emergency",
            type: "choice",
            label: "4. 遇到紧急情况（如水管漏水、着火）如何处理？",
            options: [
                { label: "能合理应对 (0)", value: 0 },
                { label: "有些犹豫 (0.5)", value: 0.5 },
                { label: "需他人指导 (1)", value: 1 },
                { label: "无法应对/惊慌 (2)", value: 2 },
                { label: "举止完全失当 (3)", value: 3 }
            ]
        },
        {
            id: "inf_jud_social",
            type: "choice",
            label: "5. 社交场合的得体性？",
            options: [
                { label: "符合社会规范 (0)", value: 0 },
                { label: "轻微改变 (0.5)", value: 0.5 },
                { label: "偶尔失礼 (1)", value: 1 },
                { label: "经常失礼/脱离社会 (2)", value: 2 },
                { label: "完全不顾场合 (3)", value: 3 }
            ]
        }
      ]
    },
    {
      id: "cdr_inf_community",
      title: "四、社会事务 (Community Affairs)",
      fields: [
        {
            id: "inf_comm_retirement",
            type: "choice",
            label: "1. 职业/工作能力（如已退休，请判断是否因认知下降导致）",
            options: [
                { label: "正常工作/与认知无关的退休 (0)", value: 0 },
                { label: "工作效率轻微下降 (0.5)", value: 0.5 },
                { label: "只能做简单工作/因病退休 (1)", value: 1 },
                { label: "无法工作 (2)", value: 2 },
                { label: "完全丧失劳动能力 (3)", value: 3 }
            ]
        },
        {
            id: "inf_comm_transport",
            type: "choice",
            label: "2. 驾驶或乘坐交通工具的安全性？",
            options: [
                { label: "独立驾驶/出行 (0)", value: 0 },
                { label: "轻微担忧/停止驾驶 (0.5)", value: 0.5 },
                { label: "需陪伴出行 (1)", value: 1 },
                { label: "无法独自出门 (2)", value: 2 },
                { label: "完全依赖 (3)", value: 3 }
            ]
        },
        {
            id: "inf_comm_shop",
            type: "choice",
            label: "3. 独立购物能力？",
            options: [
                { label: "正常 (0)", value: 0 },
                { label: "轻微困难 (0.5)", value: 0.5 },
                { label: "只能买少量熟悉物品 (1)", value: 1 },
                { label: "需人陪同 (2)", value: 2 },
                { label: "无法购物 (3)", value: 3 }
            ]
        },
        {
            id: "inf_comm_out",
            type: "choice",
            label: "4. 独立参与家庭以外的集体活动？",
            options: [
                { label: "正常参与 (0)", value: 0 },
                { label: "参与度轻微下降 (0.5)", value: 0.5 },
                { label: "不仅外表参与，活动质量下降 (1)", value: 1 },
                { label: "很少参与/需督促 (2)", value: 2 },
                { label: "完全不参与 (3)", value: 3 }
            ]
        }
      ]
    },
    {
      id: "cdr_inf_care",
      title: "五、个人生活自理 (Personal Care)",
      fields: [
        {
            id: "inf_care_dress",
            type: "choice",
            label: "1. 穿衣细节（如是否系错扣子、穿反）？",
            options: [
                { label: "完全自理 (0)", value: 0 },
                { label: "无 (0.5)", value: 0.5 }, 
                { label: "偶尔出错/需提醒 (1)", value: 1 },
                { label: "需大量协助/经常穿错 (2)", value: 2 },
                { label: "完全需人服侍 (3)", value: 3 }
            ]
        },
        {
            id: "inf_care_groom",
            type: "choice",
            label: "2. 洗漱打扮（刷牙、梳头、洗脸）？",
            options: [
                { label: "维持良好 (0)", value: 0 },
                { label: "无 (0.5)", value: 0.5 },
                { label: "需督促/提示 (1)", value: 1 },
                { label: "需协助完成 (2)", value: 2 },
                { label: "完全依赖/抗拒 (3)", value: 3 }
            ]
        },
        {
            id: "inf_care_eat",
            type: "choice",
            label: "3. 进食情况（使用餐具）？",
            options: [
                { label: "正常使用餐具 (0)", value: 0 },
                { label: "无 (0.5)", value: 0.5 },
                { label: "进食凌乱/只用勺子 (1)", value: 1 },
                { label: "需切碎食物/协助 (2)", value: 2 },
                { label: "需喂食 (3)", value: 3 }
            ]
        },
        {
            id: "inf_care_cont",
            type: "choice",
            label: "4. 二便控制（尿床/失禁次数）？",
            options: [
                { label: "完全正常 (0)", value: 0 },
                { label: "无 (0.5)", value: 0.5 },
                { label: "偶尔失禁 (1)", value: 1 },
                { label: "经常失禁 (2)", value: 2 },
                { label: "完全失禁 (3)", value: 3 }
            ]
        }
      ]
    }
  ]
};
