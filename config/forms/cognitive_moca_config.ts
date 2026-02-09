
import { FormConfig } from "../../types";

export const COGNITIVE_MOCA_CONFIG: FormConfig = {
  id: "moca_standard",
  title: "蒙特利尔认知评估量表 (MoCA)",
  version: "WCH-Standard-V1",
  sections: [
    {
      id: "moca_visuospatial",
      title: "一、视空间与执行功能 (5分)",
      fields: [
        { 
            id: "moca_trail", 
            type: "choice", 
            label: "1. 交替连线 (1-A-2-B-3-C-4-D-5-E)", 
            hint: "请受试者画线连接数字和字母",
            options: [{label: "正确", value: 1}, {label: "错误", value: 0}] 
        },
        { 
            id: "moca_cube", 
            type: "file", 
            label: "2. 临摹立方体 (拍照上传)", 
            hint: "请受试者照样画出立方体，要求线条平行且立体感正确",
            validation: { required: true }
        },
        { 
            id: "moca_cube_score", 
            type: "choice", 
            label: "立方体评分", 
            options: [{label: "正确 (1)", value: 1}, {label: "错误 (0)", value: 0}] 
        },
        { 
            id: "moca_clock_group", 
            type: "group", 
            label: "3. 画钟测验 (11点10分)", 
            children: [
                { id: "clock_contour", type: "choice", label: "轮廓", options: [{label: "完整 (1)", value: 1}, {label: "畸形/不完整", value: 0}] },
                { id: "clock_numbers", type: "choice", label: "数字", options: [{label: "完整且顺序正确 (1)", value: 1}, {label: "错误", value: 0}] },
                { id: "clock_hands", type: "choice", label: "指针", options: [{label: "指向正确 (1)", value: 1}, {label: "错误", value: 0}] }
            ]
        }
      ]
    },
    {
      id: "moca_naming",
      title: "二、命名 (3分)",
      description: "请受试者说出图片中的动物名称。",
      fields: [
        { id: "name_lion", type: "choice", label: "动物 1 (狮子/老虎?)", hint: "标准答案: 狮子 (但本任务特定要求: 鸭子、老虎、蛇)", options: [{label: "老虎 (正确)", value: 1}, {label: "错误", value: 0}] },
        { id: "name_rhino", type: "choice", label: "动物 2 (犀牛?)", hint: "任务特定要求: 鸭子", options: [{label: "鸭子 (正确)", value: 1}, {label: "错误", value: 0}] },
        { id: "name_camel", type: "choice", label: "动物 3 (骆驼?)", hint: "任务特定要求: 蛇", options: [{label: "蛇 (正确)", value: 1}, {label: "错误", value: 0}] }
      ]
    },
    {
      id: "moca_attention",
      title: "三、注意力 (6分)",
      fields: [
        { id: "digit_fwd", type: "choice", label: "数字顺背: 2-1-8-5-4", options: [{label: "正确 (1)", value: 1}, {label: "错误", value: 0}] },
        { id: "digit_bwd", type: "choice", label: "数字倒背: 7-4-2", options: [{label: "正确 (1)", value: 1}, {label: "错误", value: 0}] },
        { id: "tap_task", type: "choice", label: "点击任务 (读到1时点击)", hint: "序列: 5-2-1-3...", options: [{label: "正确 (≤2个错误)", value: 1}, {label: "错误 (>2个错误)", value: 0}] },
        { 
            id: "serial_7_group", 
            type: "group", 
            label: "连续减 7 (100-7)",
            children: [
                { id: "calc_1", type: "number", label: "100-7 (93)", hint: "输入实际回答" },
                { id: "calc_2", type: "number", label: "再减7 (86)", hint: "输入实际回答" },
                { id: "calc_3", type: "number", label: "再减7 (79)", hint: "输入实际回答" },
                { id: "calc_4", type: "number", label: "再减7 (72)", hint: "输入实际回答" },
                { id: "calc_5", type: "number", label: "再减7 (65)", hint: "输入实际回答" }
            ]
        }
      ]
    },
    {
      id: "moca_language",
      title: "四、语言与抽象 (3分)",
      fields: [
        { id: "rep_1", type: "choice", label: "复述: 我只知道小张今天是来帮过忙的人", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "rep_2", type: "choice", label: "复述: 狗在房间的时候，猫总是躲在椅子下面", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "abs_1", type: "choice", label: "抽象: 火车 - 自行车", hint: "答案: 交通工具", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
        { id: "abs_2", type: "choice", label: "抽象: 手表 - 直尺", hint: "答案: 测量工具", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] }
      ]
    },
    {
      id: "moca_recall_orientation",
      title: "五、延迟回忆与定向 (11分)",
      fields: [
        { id: "word_learning", type: "info", label: "词语学习（不计分）: 脸面、丝绸、寺庙、菊花、红色。请读两遍并要求受试者重复。" },
        { 
            id: "recall_group", 
            type: "group", 
            label: "延迟回忆 (5分钟后)",
            children: [
                { id: "recall_face", type: "choice", label: "脸面", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
                { id: "recall_velvet", type: "choice", label: "丝绸", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
                { id: "recall_church", type: "choice", label: "寺庙", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
                { id: "recall_daisy", type: "choice", label: "菊花", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
                { id: "recall_red", type: "choice", label: "红色", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] }
            ]
        },
        {
            id: "orientation_group", 
            type: "group", 
            label: "定向力",
            children: [
                { id: "ori_date", type: "choice", label: "日期", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
                { id: "ori_month", type: "choice", label: "月份", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
                { id: "ori_year", type: "choice", label: "年份", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
                { id: "ori_day", type: "choice", label: "星期", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
                { id: "ori_place", type: "choice", label: "地点 (医院/诊所)", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] },
                { id: "ori_city", type: "choice", label: "城市", options: [{label: "正确", value: 1}, {label: "错误", value: 0}] }
            ]
        }
      ]
    },
    {
        id: "moca_meta",
        title: "受试者背景",
        fields: [
            { id: "education_years", type: "number", label: "受教育年限 (年)", validation: { required: true }, hint: "≤12年 总分+1" }
        ]
    }
  ]
};
