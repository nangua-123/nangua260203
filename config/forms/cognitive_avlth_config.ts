
import { FormConfig } from "../../types";

// 华山版 AVLT 核心词库 (12词 - 严谨临床标准)
// Categories: Clothing, Professions, Flowers
const AVLT_WORDS_STRICT = [
    { label: "大衣", value: "coat" },
    { label: "长裤", value: "trousers" },
    { label: "头巾", value: "scarf" },
    { label: "手套", value: "gloves" },
    { label: "司机", value: "driver" },
    { label: "木工", value: "carpenter" },
    { label: "士兵", value: "soldier" },
    { label: "律师", value: "lawyer" },
    { label: "海棠", value: "begonia" },
    { label: "百合", value: "lily" },
    { label: "腊梅", value: "wintersweet" },
    { label: "玉兰", value: "magnolia" }
];

export const COGNITIVE_AVLTH_CONFIG: FormConfig = {
  id: "avlth_standard",
  title: "听觉词语学习测验 (AVLT-H 华山版)",
  version: "WCH-AVLT-2024-Strict",
  sections: [
    {
      id: "avlt_n1_n3",
      title: "一、即刻回忆 (N1-N3)",
      description: "请朗读词表 (1秒/个)，朗读结束后请受试者回忆。共进行3次。",
      fields: [
        { 
            id: "avlt_instruction_n1", 
            type: "info", 
            label: "【指令】我现在要读一些词给您听。请您仔细听，当我读完后，请把您记得住的词告诉我，不分先后顺序。准备好了吗？",
            hint: "点击下方按钮可播放标准录音"
        },
        {
            id: "avlt_n1_recall",
            type: "multiselect",
            label: "第 1 次回忆 (N1)",
            options: AVLT_WORDS_STRICT,
            validation: { required: true }
        },
        { 
            id: "avlt_instruction_n2", 
            type: "info", 
            label: "【指令】我现在把这些词再读一遍。还是请您仔细听，读完后，请把您记得住的词告诉我，包括您刚才已经说过的词。",
            hint: "需再次完整朗读词表"
        },
        {
            id: "avlt_n2_recall",
            type: "multiselect",
            label: "第 2 次回忆 (N2)",
            options: AVLT_WORDS_STRICT
        },
        { 
            id: "avlt_instruction_n3", 
            type: "info", 
            label: "【指令】我们要进行最后一次。还是请您仔细听，读完后，请把您记得住的词告诉我，包括您刚才已经说过的词。",
            hint: "需再次完整朗读词表"
        },
        {
            id: "avlt_n3_recall",
            type: "multiselect",
            label: "第 3 次回忆 (N3)",
            options: AVLT_WORDS_STRICT
        },
        {
            id: "avlt_n3_complete",
            type: "choice",
            label: "确认完成前三轮学习？",
            hint: "点击确认后将自动启动 N4 (5分钟) 倒计时",
            options: [{ label: "确认完成，开始计时", value: 1 }]
        }
      ]
    },
    {
      id: "avlt_n4",
      title: "二、短延迟回忆 (N4 - 5min)",
      fields: [
        { "id": "avlt_n4_recall", "type": "multiselect", "label": "5分钟延迟回忆 (N4)", "options": AVLT_WORDS_STRICT }
      ]
    },
    {
      id: "avlt_n5",
      title: "三、长延迟回忆 (N5 - 20min)",
      fields: [
        { "id": "avlt_n5_recall", "type": "multiselect", "label": "20分钟延迟回忆 (N5)", "options": AVLT_WORDS_STRICT },
        { "id": "avlt_recognition", "type": "number", "label": "再认正确数 (N6)", "suffix": "个", "validation": { "min": 0, "max": 12 } }
      ]
    }
  ]
};
