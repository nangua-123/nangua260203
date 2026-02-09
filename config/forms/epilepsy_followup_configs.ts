
import { FormConfig } from "../../types";

// --- Shared Fields for V1, V2, V3 (Pregnancy Follow-up) ---
const SHARED_PREGNANCY_FIELDS = [
    { 
        id: "followup_period_info", 
        type: "info", 
        label: "请根据“上次随访至今”的情况如实填写" 
    },
    { 
        id: "seizure_count_total", 
        type: "number", 
        label: "发作总次数 (含小发作)", 
        suffix: "次", 
        validation: { required: true, min: 0 } 
    },
    { 
        id: "gtcs_count", 
        type: "number", 
        label: "强直阵挛发作 (大发作) 次数", 
        suffix: "次", 
        validation: { required: true, min: 0 } 
    },
    { 
        id: "max_duration", 
        type: "choice", 
        label: "最长持续时间", 
        options: [
            { label: "< 1分钟", value: "less_1" },
            { label: "1 - 5分钟", value: "1_5" },
            { label: "5 - 15分钟", value: "5_15" },
            { label: "15 - 30分钟", value: "15_30" },
            { label: "> 30分钟", value: "more_30" }
        ],
        visibleIf: { gtcs_count: "GTCS_PRESENT" } // Note: Logic handled in App logic if count > 0
    },
    { 
        id: "tdm_info", 
        type: "group", 
        label: "血药浓度监测 (TDM)" 
    },
    { 
        id: "tdm_date", 
        type: "date", 
        label: "采集日期" 
    },
    { 
        id: "tdm_drug_name", 
        type: "text", 
        label: "监测药物名称" 
    },
    { 
        id: "tdm_sample_dosage", 
        type: "text", 
        label: "采集时日剂量 (mg/d)" 
    },
    { 
        id: "tdm_value", 
        type: "number", 
        label: "谷浓度实测值", 
        suffix: "ug/ml" 
    },
    { 
        id: "pregnancy_status_group", 
        type: "group", 
        label: "妊娠结局判定" 
    },
    { 
        id: "pregnancy_outcome", 
        type: "choice", 
        label: "当前妊娠状态", 
        options: [
            { label: "持续妊娠中", value: "ONGOING" },
            { label: "已分娩 (早产/足月)", value: "DELIVERED" },
            { label: "流产/终止妊娠", value: "ABORTION" }
        ],
        validation: { required: true }
    },
    { 
        id: "abortion_type", 
        type: "choice", 
        label: "流产类型", 
        visibleIf: { pregnancy_outcome: "ABORTION" },
        options: [
            { label: "自然流产", value: "SPONTANEOUS" },
            { label: "人工流产 (医学建议)", value: "INDUCED_MEDICAL" },
            { label: "人工流产 (个人意愿)", value: "INDUCED_PERSONAL" }
        ]
    },
    {
        id: "abortion_reason_medical",
        type: "text",
        label: "医学建议终止原因",
        visibleIf: { pregnancy_outcome: "ABORTION", abortion_type: "INDUCED_MEDICAL" },
        hint: "是否与胎儿畸形或母亲癫痫发作相关？"
    }
];

// --- Scale: EPDS (Edinburgh Postnatal Depression Scale) ---
const EPDS_SECTION = {
    id: "epds_scale",
    title: "爱丁堡产后抑郁量表 (EPDS)",
    description: "请根据过去7天的感受选择最合适的选项。",
    fields: [
        { id: "epds_q1", type: "choice", label: "1. 我能看到事物有趣的一面，并笑得开心", options: [{"label":"同以前一样 (0)", "value":0}, {"label":"没有以前那么多 (1)", "value":1}, {"label":"肯定比以前少 (2)", "value":2}, {"label":"完全不能 (3)", "value":3}] },
        { id: "epds_q2", type: "choice", label: "2. 我欣然期待未来的一切", options: [{"label":"同以前一样 (0)", "value":0}, {"label":"没有以前那么多 (1)", "value":1}, {"label":"肯定比以前少 (2)", "value":2}, {"label":"完全不能 (3)", "value":3}] },
        { id: "epds_q3", type: "choice", label: "3. 当事情出错时，我会不必要地责备自己", options: [{"label":"没有这样 (0)", "value":0}, {"label":"不经常这样 (1)", "value":1}, {"label":"有时候这样 (2)", "value":2}, {"label":"大部分时候这样 (3)", "value":3}] },
        { id: "epds_q4", type: "choice", label: "4. 我无缘无故感到焦虑和担心", options: [{"label":"一点也没有 (0)", "value":0}, {"label":"极少有 (1)", "value":1}, {"label":"有时候这样 (2)", "value":2}, {"label":"经常这样 (3)", "value":3}] },
        { id: "epds_q5", type: "choice", label: "5. 我无缘无故感到害怕和恐慌", options: [{"label":"一点也没有 (0)", "value":0}, {"label":"不经常这样 (1)", "value":1}, {"label":"有时候这样 (2)", "value":2}, {"label":"相当多时候这样 (3)", "value":3}] },
        { id: "epds_q6", type: "choice", label: "6. 很多事情冲着我过来，使我透不过气", options: [{"label":"我一直能应付得好 (0)", "value":0}, {"label":"大部分时候我都能应付 (1)", "value":1}, {"label":"有时候我不能应付 (2)", "value":2}, {"label":"大多数时候我都不能应付 (3)", "value":3}] },
        { id: "epds_q7", type: "choice", label: "7. 我很不开心，以致失眠", options: [{"label":"一点也没有 (0)", "value":0}, {"label":"不经常这样 (1)", "value":1}, {"label":"有时候这样 (2)", "value":2}, {"label":"大部分时候这样 (3)", "value":3}] },
        { id: "epds_q8", type: "choice", label: "8. 我感到难过和悲伤", options: [{"label":"一点也没有 (0)", "value":0}, {"label":"不经常这样 (1)", "value":1}, {"label":"相当多时候这样 (2)", "value":2}, {"label":"大部分时候这样 (3)", "value":3}] },
        { id: "epds_q9", type: "choice", label: "9. 我不开心到哭", options: [{"label":"没有这样 (0)", "value":0}, {"label":"只是偶尔这样 (1)", "value":1}, {"label":"有时候这样 (2)", "value":2}, {"label":"大部分时候这样 (3)", "value":3}] },
        { id: "epds_q10", type: "choice", label: "10. 我想过要伤害自己", options: [{"label":"没有这样 (0)", "value":0}, {"label":"很少这样 (1)", "value":1}, {"label":"有时候这样 (2)", "value":2}, {"label":"相当多时候这样 (3)", "value":3}] }
    ]
};

// --- Scale: SBQ (Sedentary Behavior Questionnaire) ---
const SBQ_ITEMS = [
    "看电视", "玩电脑/视频游戏", "坐着听音乐/打电话", "坐着阅读", 
    "演奏乐器/做手工", "坐着聊天/社交", "驾驶/乘坐交通工具", "伏案工作/学习", "其他静坐活动"
];
const SBQ_OPTIONS = [
    { label: "无", value: 0 },
    { label: "≤15分钟", value: 15 },
    { label: "30分钟", value: 30 },
    { label: "1小时", value: 60 },
    { label: "2小时", value: 120 },
    { label: "3小时", value: 180 },
    { label: "4小时", value: 240 },
    { label: "5小时", value: 300 },
    { label: "≥6小时", value: 360 }
];

const SBQ_SECTION = {
    id: "sbq_scale",
    title: "久坐行为量表 (SBQ)",
    description: "请分别评估工作日与周末的静坐时间。",
    fields: SBQ_ITEMS.flatMap((item, idx) => [
        { 
            id: `sbq_wd_${idx}`, 
            type: "choice", 
            label: `[工作日] ${item}`, 
            options: SBQ_OPTIONS 
        },
        { 
            id: `sbq_we_${idx}`, 
            type: "choice", 
            label: `[周末] ${item}`, 
            options: SBQ_OPTIONS 
        }
    ])
};

// --- Scale: GPAQ (Global Physical Activity Questionnaire) ---
const GPAQ_SECTION = {
    id: "gpaq_scale",
    title: "全球体力活动问卷 (GPAQ)",
    fields: [
        { id: "vigorous_work_days", type: "number", label: "工作相关：剧烈活动每周天数", suffix: "天", validation: { min: 0, max: 7 } },
        { id: "vigorous_work_time", type: "number", label: "工作相关：剧烈活动每天时长", suffix: "分钟" },
        { id: "moderate_work_days", type: "number", label: "工作相关：中等强度活动每周天数", suffix: "天", validation: { min: 0, max: 7 } },
        { id: "moderate_work_time", type: "number", label: "工作相关：中等强度活动每天时长", suffix: "分钟" },
        { id: "transport_days", type: "number", label: "交通出行：步行/骑车每周天数", suffix: "天", validation: { min: 0, max: 7 } },
        { id: "transport_time", type: "number", label: "交通出行：步行/骑车每天时长", suffix: "分钟" },
        { id: "vigorous_rec_days", type: "number", label: "休闲运动：剧烈活动每周天数", suffix: "天", validation: { min: 0, max: 7 } },
        { id: "vigorous_rec_time", type: "number", label: "休闲运动：剧烈活动每天时长", suffix: "分钟" },
        { id: "moderate_rec_days", type: "number", label: "休闲运动：中等强度活动每周天数", suffix: "天", validation: { min: 0, max: 7 } },
        { id: "moderate_rec_time", type: "number", label: "休闲运动：中等强度活动每天时长", suffix: "分钟" }
    ]
};

// --- Config Exports ---

export const EPILEPSY_V1_CONFIG: FormConfig = {
    id: "EPILEPSY_V1",
    title: "V1 随访 (12周±7天)",
    version: "2.0",
    sections: [
        { id: "v1_clinical", title: "临床与用药监测", fields: SHARED_PREGNANCY_FIELDS as any },
        { id: "v1_lifestyle", title: "高原生活方式", fields: [
            ...SBQ_SECTION.fields, 
            ...GPAQ_SECTION.fields
        ] as any }
    ]
};

export const EPILEPSY_V2_CONFIG: FormConfig = {
    id: "EPILEPSY_V2",
    title: "V2 随访 (24周±7天)",
    version: "2.0",
    sections: [
        { id: "v2_clinical", title: "临床与用药监测", fields: SHARED_PREGNANCY_FIELDS as any },
        { id: "v2_lifestyle", title: "高原生活方式", fields: [
            ...SBQ_SECTION.fields, 
            ...GPAQ_SECTION.fields
        ] as any }
    ]
};

export const EPILEPSY_V3_CONFIG: FormConfig = {
    id: "EPILEPSY_V3",
    title: "V3 随访 (36周±7天)",
    version: "2.0",
    sections: [
        { id: "v3_clinical", title: "临床与用药监测", fields: SHARED_PREGNANCY_FIELDS as any },
        EPDS_SECTION as any // V3 Pre-birth depression check
    ]
};

export const EPILEPSY_V4_CONFIG: FormConfig = {
    id: "EPILEPSY_V4",
    title: "V4 产后随访 (分娩后)",
    version: "2.0",
    sections: [
        { 
            id: "delivery_info", 
            title: "分娩信息", 
            fields: [
                { id: "delivery_date", type: "date", label: "分娩日期", validation: { required: true } },
                { id: "delivery_mode", type: "choice", label: "分娩方式", options: [{ label: "顺产", value: "VAGINAL" }, { label: "剖宫产", value: "CS" }, { label: "产钳/胎吸", value: "ASSISTED" }] },
                { id: "complications", type: "multiselect", label: "分娩并发症 (多选)", options: [
                    { label: "产后出血", value: "HEMORRHAGE" },
                    { label: "羊水栓塞", value: "EMBOLISM" },
                    { label: "子宫破裂", value: "RUPTURE" },
                    { label: "产褥感染", value: "INFECTION" },
                    { label: "无", value: "NONE", exclusion: true }
                ]}
            ]
        },
        { 
            id: "neonate_info", 
            title: "新生儿指标", 
            fields: [
                { id: "gender", type: "choice", label: "性别", options: [{ label: "男", value: "M" }, { label: "女", value: "F" }] },
                { id: "birth_weight", type: "number", label: "出生体重", suffix: "g", validation: { required: true } },
                { id: "is_low_birth_weight", type: "info", label: "⚠️ 低出生体重儿 (<2500g)", visibleIf: { birth_weight: "<2500" } }, // Logic handled in renderer or post-process
                { id: "birth_length", type: "number", label: "身长", suffix: "cm" },
                { id: "head_circumference", type: "number", label: "头围", suffix: "cm" },
                { id: "apgar_score", type: "number", label: "Apgar总分 (1min)", validation: { min: 0, max: 10 } },
                { id: "has_malformation", type: "choice", label: "是否有畸形", options: [{ label: "否", value: false }, { label: "是", value: true }] },
                { id: "malformation_desc", type: "text", label: "畸形描述", visibleIf: { has_malformation: true } }
            ]
        },
        EPDS_SECTION as any
    ]
};

export const EPILEPSY_V5_CONFIG: FormConfig = {
    id: "EPILEPSY_V5",
    title: "V5 后代随访 (产后6-12月)",
    version: "2.0",
    sections: [
        {
            id: "child_development",
            title: "后代发育评估",
            fields: [
                { id: "child_age_month", type: "number", label: "小孩月龄", suffix: "月", validation: { required: true } },
                { id: "current_height", type: "number", label: "当前身高", suffix: "cm" },
                { id: "current_weight", type: "number", label: "当前体重", suffix: "kg" },
                { id: "ddst_completed", type: "choice", label: "是否完成丹佛发展筛查 (DDST)", options: [{ label: "是", value: true }, { label: "否", value: false }] },
                { id: "ddst_result", type: "choice", label: "DDST 结果", visibleIf: { ddst_completed: true }, options: [{ label: "正常", value: "NORMAL" }, { label: "可疑", value: "SUSPECT" }, { label: "异常", value: "ABNORMAL" }] },
                { id: "ddst_abnormal_desc", type: "text", label: "异常发育能区描述", visibleIf: { ddst_result: "ABNORMAL" } }
            ]
        },
        EPDS_SECTION as any // Postpartum depression check again
    ]
};
