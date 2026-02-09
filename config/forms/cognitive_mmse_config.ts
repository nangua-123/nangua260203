
import { FormConfig } from "../../types";

export const COGNITIVE_MMSE_CONFIG: FormConfig = {
  id: "mmse_standard",
  title: "简易精神状态检查 (MMSE)",
  version: "Standard-2024-CRF",
  sections: [
    {
      id: "mmse_orientation",
      title: "一、定向力 (10分)",
      fields: [
        { id: "ori_time_year", type: "choice", label: "今年是哪一年？", options: [{label: "正确 (2024)", value: 1}, {label: "错误", value: 0}] },
        { id: "ori_time_season", type: "choice", label: "现在是什么季节？", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "ori_time_month", type: "choice", label: "现在是几月？", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "ori_time_date", type: "choice", label: "今天是几号？", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "ori_time_day", type: "choice", label: "今天是星期几？", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        
        { id: "ori_place_province", type: "choice", label: "我们在哪个省/市？", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "ori_place_district", type: "choice", label: "我们在哪个区/县？", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "ori_place_street", type: "choice", label: "我们在哪条街道/乡镇？", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "ori_place_floor", type: "choice", label: "我们在第几层楼？", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "ori_place_spot", type: "choice", label: "这里是什么地方(具体名称)？", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] }
      ]
    },
    {
      id: "mmse_registration",
      title: "二、即刻记忆 (3分)",
      fields: [
        { id: "reg_intro", type: "info", label: "请告诉受试者：'我将说三个词，请您记住，稍后我会问您。皮球、国旗、树木。'" },
        { id: "reg_ball", type: "choice", label: "皮球", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "reg_flag", type: "choice", label: "国旗", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "reg_tree", type: "choice", label: "树木", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] }
      ]
    },
    {
      id: "mmse_attention",
      title: "三、注意力和计算力 (5分)",
      description: "请受试者计算 100 减 7，然后从得数再减 7，以此类推，共减 5 次。请记录受试者回答的具体数字。",
      fields: [
        { id: "calc_1", type: "number", label: "100 - 7 = ?", hint: "目标: 93" },
        { id: "calc_2", type: "number", label: "再减 7 = ?", hint: "目标: 86" },
        { id: "calc_3", type: "number", label: "再减 7 = ?", hint: "目标: 79" },
        { id: "calc_4", type: "number", label: "再减 7 = ?", hint: "目标: 72" },
        { id: "calc_5", type: "number", label: "再减 7 = ?", hint: "目标: 65" }
      ]
    },
    {
      id: "mmse_recall",
      title: "四、延迟回忆 (3分)",
      fields: [
        { id: "recall_ball", type: "choice", label: "回忆：皮球", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "recall_flag", type: "choice", label: "回忆：国旗", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "recall_tree", type: "choice", label: "回忆：树木", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] }
      ]
    },
    {
      id: "mmse_language",
      title: "五、语言能力 (9分)",
      fields: [
        { id: "lang_name_watch", type: "choice", label: "命名：手表", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "lang_name_pencil", type: "choice", label: "命名：铅笔", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "lang_repetition", type: "choice", label: "复述：大家齐心协力拉紧绳", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "lang_command_take", type: "choice", label: "指令1：右手拿纸", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "lang_command_fold", type: "choice", label: "指令2：将纸对折", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "lang_command_put", type: "choice", label: "指令3：放在左腿上", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "lang_read", type: "choice", label: "阅读：请闭上您的眼睛", options: [{label: "执行正确", value: 1}, {label: "未执行", value: 0}] },
        { id: "lang_write", type: "choice", label: "书写：写一个完整的句子", hint: "需包含主语和谓语，且有意义", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "lang_draw", type: "choice", label: "绘图：临摹交叉五边形", hint: "必须有两个五边形，交叉处为四边形", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] }
      ]
    },
    {
        id: "mmse_meta",
        title: "受试者背景",
        fields: [
            { id: "education_years", type: "number", label: "受教育年限 (年)", validation: { required: true }, hint: "用于评分修正" }
        ]
    }
  ]
};
