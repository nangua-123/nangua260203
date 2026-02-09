
export const COGNITIVE_ASSESSMENT_CONFIG = {
  "scaleId": "cognitive_comprehensive",
  "title": "认知障碍综合评估套件 (AD/MCI)",
  "version": "WCH-NEURO-V3.1",
  "sections": [
    {
      "id": "mmse_core",
      "title": "一、简易精神状态评价 (MMSE)",
      "fields": [
        { "id": "orientation_time", "type": "group", "label": "定向力-时间", "children": [
            { "id": "mmse_year", "type": "choice", "label": "今年的年份？", "options": [{"label":"正确","value":1},{"label":"错误","value":0}] },
            { "id": "mmse_season", "type": "choice", "label": "现在的季节？", "options": [{"label":"正确","value":1},{"label":"错误","value":0}] },
            { "id": "mmse_month", "type": "choice", "label": "现在是几月？", "options": [{"label":"正确","value":1},{"label":"错误","value":0}] },
            { "id": "mmse_date", "type": "choice", "label": "今天是几号？", "options": [{"label":"正确","value":1},{"label":"错误","value":0}] },
            { "id": "mmse_day", "type": "choice", "label": "今天是星期几？", "options": [{"label":"正确","value":1},{"label":"错误","value":0}] }
        ]},
        { "id": "orientation_place", "type": "group", "label": "定向力-地点", "children": [
            { "id": "mmse_country", "type": "choice", "label": "我们在哪个国家？", "options": [{"label":"正确","value":1},{"label":"错误","value":0}] },
            { "id": "mmse_province", "type": "choice", "label": "哪个省/市？", "options": [{"label":"正确","value":1},{"label":"错误","value":0}] },
            { "id": "mmse_city", "type": "choice", "label": "哪个城区/县？", "options": [{"label":"正确","value":1},{"label":"错误","value":0}] },
            { "id": "mmse_hospital", "type": "choice", "label": "这里是什么地方(医院/家)？", "options": [{"label":"正确","value":1},{"label":"错误","value":0}] },
            { "id": "mmse_floor", "type": "choice", "label": "我们在第几层楼？", "options": [{"label":"正确","value":1},{"label":"错误","value":0}] }
        ]},
        { "id": "registration", "type": "choice", "label": "即刻记忆：皮球、国旗、树木", "hint": "请连续说出这三个词，并让受试者重复，只计第一次尝试的得分", "options": [
            { "label": "3个全对", "value": 3 }, { "label": "对2个", "value": 2 }, { "label": "对1个", "value": 1 }, { "label": "全错", "value": 0 }
        ]},
        { "id": "attention_calc", "type": "choice", "label": "注意力和计算力：100连续减7 (5次)", "options": [
            { "label": "5个全对 (93,86,79,72,65)", "value": 5 }, { "label": "对4个", "value": 4 }, { "label": "对3个", "value": 3 }, { "label": "对2个", "value": 2 }, { "label": "对1个", "value": 1 }, { "label": "全错", "value": 0 }
        ]},
        { "id": "recall", "type": "choice", "label": "回忆：刚才展示的三个词是什么？", "options": [
            { "label": "3个全对", "value": 3 }, { "label": "对2个", "value": 2 }, { "label": "对1个", "value": 1 }, { "label": "全错", "value": 0 }
        ]},
        { "id": "language_naming", "type": "choice", "label": "命名：出示手表和铅笔", "options": [
            { "label": "2个全对", "value": 2 }, { "label": "对1个", "value": 1 }, { "label": "全错", "value": 0 }
        ]},
        { "id": "language_repetition", "type": "choice", "label": "复述：大家齐心协力拉紧绳", "options": [{"label":"正确","value":1},{"label":"错误","value":0}] },
        { "id": "language_command", "type": "choice", "label": "3步指令：右手拿纸，对折，放在腿上", "options": [
            { "label": "3步全对", "value": 3 }, { "label": "对2步", "value": 2 }, { "label": "对1步", "value": 1 }, { "label": "全错", "value": 0 }
        ]},
        { "id": "language_reading", "type": "choice", "label": "阅读指令：请闭上您的眼睛", "options": [{"label":"执行正确","value":1},{"label":"未执行","value":0}] },
        { "id": "language_writing", "type": "choice", "label": "书写：写一个完整的句子", "options": [{"label":"有主谓宾且通顺","value":1},{"label":"不完整/无意义","value":0}] },
        { "id": "visuospatial_copy", "type": "choice", "label": "视空间：临摹交叉五边形", "options": [{"label":"图形正确且相交成四边形","value":1},{"label":"构图失败","value":0}] }
      ]
    },
    {
      "id": "adl_iadl",
      "title": "二、日常生活能力 (ADL/IADL)",
      "fields": [
        { "id": "adl_group", "type": "group", "label": "ADL (Barthel指数)" },
        { "id": "adl_feeding", "type": "choice", "label": "进食", "options": [{"label":"完全自理 (10)", "value":10}, {"label":"需部分帮助 (5)", "value":5}, {"label":"完全依赖 (0)", "value":0}] },
        { "id": "adl_bathing", "type": "choice", "label": "洗澡", "options": [{"label":"自理 (5)", "value":5}, {"label":"依赖 (0)", "value":0}] },
        { "id": "adl_grooming", "type": "choice", "label": "修饰 (洗脸/梳头/刷牙)", "options": [{"label":"自理 (5)", "value":5}, {"label":"依赖 (0)", "value":0}] },
        { "id": "adl_dressing", "type": "choice", "label": "穿衣", "options": [{"label":"自理 (10)", "value":10}, {"label":"需帮助 (5)", "value":5}, {"label":"依赖 (0)", "value":0}] },
        { "id": "adl_bowel", "type": "choice", "label": "大便控制", "options": [{"label":"自控 (10)", "value":10}, {"label":"偶尔失禁 (5)", "value":5}, {"label":"失禁 (0)", "value":0}] },
        { "id": "adl_bladder", "type": "choice", "label": "小便控制", "options": [{"label":"自控 (10)", "value":10}, {"label":"偶尔失禁 (5)", "value":5}, {"label":"失禁 (0)", "value":0}] },
        { "id": "adl_toilet", "type": "choice", "label": "上厕所", "options": [{"label":"自理 (10)", "value":10}, {"label":"需帮助 (5)", "value":5}, {"label":"依赖 (0)", "value":0}] },
        { "id": "adl_transfer", "type": "choice", "label": "床椅转移", "options": [{"label":"自理 (15)", "value":15}, {"label":"需小量帮助 (10)", "value":10}, {"label":"需大量帮助 (5)", "value":5}, {"label":"完全依赖 (0)", "value":0}] },
        { "id": "adl_mobility", "type": "choice", "label": "平地行走", "options": [{"label":"45米以上 (15)", "value":15}, {"label":"需帮助走45米 (10)", "value":10}, {"label":"轮椅 (5)", "value":5}, {"label":"卧床 (0)", "value":0}] },
        { "id": "adl_stairs", "type": "choice", "label": "上下楼梯", "options": [{"label":"自理 (10)", "value":10}, {"label":"需帮助 (5)", "value":5}, {"label":"无法进行 (0)", "value":0}] },

        { "id": "iadl_group", "type": "group", "label": "IADL (Lawton量表)" },
        { "id": "iadl_telephone", "type": "choice", "label": "使用电话", "options": [{"label":"独立使用 (1)", "value":1}, {"label":"不能使用 (0)", "value":0}] },
        { "id": "iadl_shopping", "type": "choice", "label": "购物", "options": [{"label":"独立完成 (1)", "value":1}, {"label":"不能完成 (0)", "value":0}] },
        { "id": "iadl_food", "type": "choice", "label": "备餐", "options": [{"label":"独立完成 (1)", "value":1}, {"label":"不能完成 (0)", "value":0}] },
        { "id": "iadl_housework", "type": "choice", "label": "整理家务", "options": [{"label":"维持高水平 (1)", "value":1}, {"label":"不能维持 (0)", "value":0}] },
        { "id": "iadl_laundry", "type": "choice", "label": "洗衣", "options": [{"label":"独立完成 (1)", "value":1}, {"label":"不能完成 (0)", "value":0}] },
        { "id": "iadl_transport", "type": "choice", "label": "使用交通工具", "options": [{"label":"独立旅行 (1)", "value":1}, {"label":"不能旅行 (0)", "value":0}] },
        { "id": "iadl_meds", "type": "choice", "label": "个人服药", "options": [{"label":"按时按量 (1)", "value":1}, {"label":"不能 (0)", "value":0}] },
        { "id": "iadl_finance", "type": "choice", "label": "理财能力", "options": [{"label":"独立管理 (1)", "value":1}, {"label":"不能管理 (0)", "value":0}] }
      ]
    },
    {
      "id": "moca_supplement",
      "title": "三、MoCA 补充项 (针对 MCI)",
      "fields": [
        { "id": "years_of_education", "type": "number", "label": "受教育年限", "suffix": "年", "hint": "用于最终分值矫正 (≤12年 +1分)", "validation": { "required": true } },
        { "id": "moca_trail", "type": "choice", "label": "交替连线 (1-A-2-B-3-C-4-D-5-E)", "options": [{"label":"完全正确","value":1},{"label":"错误","value":0}] },
        { "id": "moca_cube", "type": "choice", "label": "视空间：临摹立方体", "options": [{"label":"立体感/线条正确","value":1},{"label":"错误","value":0}] },
        { "id": "moca_clock", "type": "choice", "label": "视空间：画钟 (11点10分)", "options": [
            { "label": "轮廓、数字、指针全对 (3)", "value": 3 }, { "label": "对2项 (2)", "value": 2 }, { "label": "对1项 (1)", "value": 1 }, { "label": "全错 (0)", "value": 0 }
        ]},
        { "id": "moca_naming", "type": "choice", "label": "命名 (狮子、犀牛、骆驼)", "options": [
            { "label": "3个全对 (3)", "value": 3 }, { "label": "对2个 (2)", "value": 2 }, { "label": "对1个 (1)", "value": 1 }, { "label": "全错 (0)", "value": 0 }
        ]},
        { "id": "moca_delayed_recall", "type": "multiselect", "label": "延迟回忆 (5分钟后)", "hint": "脸面、丝绸、寺庙、菊花、红色", "options": [
            { "label": "脸面", "value": "face" }, { "label": "丝绸", "value": "velvet" }, { "label": "寺庙", "value": "church" }, { "label": "菊花", "value": "daisy" }, { "label": "红色", "value": "red" }
        ]},
        { "id": "moca_abstraction", "type": "choice", "label": "抽象概括 (火车-自行车，手表-尺子)", "options": [
            { "label": "2组全对 (2)", "value": 2 }, { "label": "对1组 (1)", "value": 1 }, { "label": "全错 (0)", "value": 0 }
        ]}
      ]
    },
    {
      "id": "avlt_immediate",
      "title": "四、AVLT-H 听觉词语学习 (即刻)",
      "fields": [
        { "id": "avlt_info", "type": "info", "label": "请向受试者朗读12个词语：老鼠、嘴唇、窗户、汽车、咖啡、帽子、大象、门帘、月亮、火车、学校、鼻子。速度：每秒1个。" },
        { "id": "avlt_n1", "type": "number", "label": "第1次回忆正确数 (N1)", "suffix": "个", "validation": { "min": 0, "max": 12 } },
        { "id": "avlt_n2", "type": "number", "label": "第2次回忆正确数 (N2)", "suffix": "个", "validation": { "min": 0, "max": 12 } },
        { "id": "avlt_n3", "type": "number", "label": "第3次回忆正确数 (N3)", "suffix": "个", "validation": { "min": 0, "max": 12 } },
        { "id": "avlt_n3_complete", "type": "choice", "label": "是否完成即刻学习？(将启动N4计时)", "options": [{ "label": "确认完成", "value": 1 }] }
      ]
    },
    {
      "id": "avlt_n4",
      "title": "五、AVLT-H 短延迟回忆 (5min)",
      "fields": [
        { "id": "avlt_n4_score", "type": "number", "label": "5分钟延迟回忆正确数 (N4)", "suffix": "个", "validation": { "min": 0, "max": 12 } }
      ]
    },
    {
      "id": "avlt_n5",
      "title": "六、AVLT-H 长延迟回忆 (20min)",
      "fields": [
        { "id": "avlt_n5_score", "type": "number", "label": "20分钟延迟回忆正确数 (N5)", "suffix": "个", "validation": { "min": 0, "max": 12 } },
        { "id": "avlt_recognition", "type": "number", "label": "再认正确数 (N6 - 混杂词中辨认)", "suffix": "个", "validation": { "min": 0, "max": 12 } }
      ]
    }
  ]
};
