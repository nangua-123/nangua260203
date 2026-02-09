
import { FormConfig } from "../../types";

export const COGNITIVE_CDR_SUBJECT_CONFIG: FormConfig = {
  id: "cdr_subject_full",
  title: "CDR 临床痴呆评定 - 受试者访谈",
  version: "WCH-CDR-2024-Subject",
  sections: [
    {
      id: "cdr_sub_memory",
      title: "一、记忆与回忆 (Memory)",
      description: "需结合知情者提供的信息进行交叉验证。",
      fields: [
        {
            id: "sub_mem_verify_week",
            type: "choice",
            label: "1. 请描述刚才知情者提到的“一周内发生的具体事件”？",
            hint: "参考知情者字段: event_description_1week",
            options: [
                { label: "大部分正确 (0)", value: 0 },
                { label: "部分正确 (0.5)", value: 0.5 },
                { label: "大部分不正确 (1)", value: 1 }
            ]
        },
        {
            id: "sub_reg_intro",
            type: "info",
            label: "【指令】请告诉受试者：“我将说一个姓名和地址，请您立刻重复。我们将重复3次，请尽量记住。” 内容：李 (Li)、雷 (Lei)、北京市 (Beijing)、金三角 (Gold Triangle)、28号 (No. 28)"
        },
        {
            id: "sub_reg_trial_1",
            type: "number",
            label: "第1次重复正确数 (0-5)",
            validation: { min: 0, max: 5 }
        },
        {
            id: "sub_reg_trial_2",
            type: "number",
            label: "第2次重复正确数 (0-5)",
            validation: { min: 0, max: 5 }
        },
        {
            id: "sub_reg_trial_3",
            type: "number",
            label: "第3次重复正确数 (0-5)",
            validation: { min: 0, max: 5 }
        }
      ]
    },
    {
      id: "cdr_sub_orientation",
      title: "二、定向力 (Orientation)",
      fields: [
        { id: "sub_ori_time", type: "choice", label: "1. 现在大约几点？(允许误差1小时)", options: [{label: "正确 (0)", value: 0}, {label: "错误 (1)", value: 1}] },
        { id: "sub_ori_place", type: "choice", label: "2. 这里是什么地方？(具体地点)", options: [{label: "正确 (0)", value: 0}, {label: "错误 (1)", value: 1}] },
        { id: "sub_ori_city", type: "choice", label: "3. 我们在哪个城市？", options: [{label: "正确 (0)", value: 0}, {label: "错误 (1)", value: 1}] },
        { id: "sub_ori_person", type: "choice", label: "4. 陪同您来的人是谁？", options: [{label: "正确 (0)", value: 0}, {label: "错误 (1)", value: 1}] }
      ]
    },
    {
      id: "cdr_sub_judgment",
      title: "三、判断与抽象 (Judgment)",
      fields: [
        {
            id: "sub_jud_sim_1",
            type: "choice",
            label: "1. 【相似性】萝卜和芹菜有什么共同点？",
            options: [
                { label: "蔬菜 (0)", value: 0 },
                { label: "吃的东西 (1)", value: 0.5 },
                { label: "不切题 (2)", value: 1 }
            ]
        },
        {
            id: "sub_jud_sim_2",
            type: "choice",
            label: "2. 【相似性】桌子和书架有什么共同点？",
            options: [
                { label: "家具 (0)", value: 0 },
                { label: "木头做的/有腿 (1)", value: 0.5 },
                { label: "不切题 (2)", value: 1 }
            ]
        },
        {
            id: "sub_jud_diff_1",
            type: "choice",
            label: "3. 【区别】撒谎和失误有什么区别？",
            options: [
                { label: "动机不同(故意vs无意) (0)", value: 0 },
                { label: "结果不同/举例说明 (1)", value: 0.5 },
                { label: "不知道/一样 (2)", value: 1 }
            ]
        },
        {
            id: "sub_jud_diff_2",
            type: "choice",
            label: "4. 【区别】河流与运河有什么区别？",
            options: [
                { label: "成因不同(自然vs人工) (0)", value: 0 },
                { label: "功能不同/大小不同 (1)", value: 0.5 },
                { label: "不知道 (2)", value: 1 }
            ]
        }
      ]
    },
    {
      id: "cdr_sub_calc",
      title: "四、计算与常识 (Calculation)",
      fields: [
        {
            id: "sub_calc_1",
            type: "choice",
            label: "1. 10元钱等于多少个5角？",
            options: [
                { label: "20个 (正确)", value: 0 },
                { label: "错误", value: 1 }
            ]
        },
        {
            id: "sub_calc_2",
            type: "choice",
            label: "2. 135元能换多少个5元？",
            options: [
                { label: "27个 (正确)", value: 0 },
                { label: "错误", value: 1 }
            ]
        },
        {
            id: "sub_calc_serial",
            type: "choice",
            label: "3. 20 连续减 3 (20-17-14-11-8-5-2)",
            options: [
                { label: "全对/错1个 (0)", value: 0 },
                { label: "错2-3个 (1)", value: 1 },
                { label: "完全无法进行 (2)", value: 2 }
            ]
        }
      ]
    },
    {
      id: "cdr_sub_insight",
      title: "五、自知力 (Insight)",
      fields: [
        {
            id: "sub_insight_score",
            type: "choice",
            label: "受试者对自身失能和日常生活状况的理解程度？",
            options: [
                { label: "1. 好 (完全自知)", value: 0 },
                { label: "2. 部分自知 (承认有问题但归咎于他因)", value: 1 },
                { label: "3. 无自知力 (完全否认)", value: 2 }
            ]
        }
      ]
    }
  ]
};
