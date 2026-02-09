
export const CDR_INTERVIEW_CONFIG = {
  "scaleId": "cdr_standard",
  "title": "临床痴呆评定量表 (CDR)",
  "version": "WCH-CDR-2.0 (Double Blind)",
  "sections": [
    {
      "id": "cdr_informant",
      "title": "A. 询问知情者 (Informant)",
      "fields": [
        { "id": "inf_memory_group", "type": "group", "label": "记忆力评估" },
        { "id": "cdr_mem_1", "type": "choice", "label": "患者是否有记忆力减退或思考困难的问题？", "options": [{"label":"是","value":1},{"label":"否","value":0}] },
        { "id": "cdr_mem_2", "type": "choice", "label": "这种情况是持续的还是波动的？", "options": [{"label":"持续","value":1},{"label":"波动","value":0}] },
        { "id": "cdr_mem_3", "type": "choice", "label": "是否记得最近发生的重要事件？", "options": [{"label":"通常记得","value":0},{"label":"部分记得","value":0.5},{"label":"基本不记得","value":1}] },
        { "id": "cdr_mem_4", "type": "choice", "label": "是否重复问同一个问题或讲同一件事？", "options": [{"label":"无","value":0},{"label":"偶尔","value":0.5},{"label":"经常","value":1}] },
        
        { "id": "inf_orientation_group", "type": "group", "label": "定向力评估" },
        { "id": "cdr_ori_1", "type": "choice", "label": "经常不知道准确的月份和年份？", "options": [{"label":"从不","value":0},{"label":"偶尔","value":0.5},{"label":"经常","value":1}] },
        { "id": "cdr_ori_2", "type": "choice", "label": "在熟悉的街道或环境中迷路？", "options": [{"label":"从不","value":0},{"label":"偶尔","value":0.5},{"label":"经常","value":1}] },

        { "id": "inf_judgment_group", "type": "group", "label": "判断与解决问题" },
        { "id": "cdr_jud_1", "type": "choice", "label": "处理复杂财务或商业事务的能力？", "options": [{"label":"正常","value":0},{"label":"轻微受损","value":0.5},{"label":"严重受损","value":1}] },
        { "id": "cdr_jud_2", "type": "choice", "label": "应对突发小事故的判断力？", "options": [{"label":"良好","value":0},{"label":"犹豫/偶尔错误","value":0.5},{"label":"无法处理","value":1}] },

        { "id": "inf_community_group", "type": "group", "label": "社会事务" },
        { "id": "cdr_comm_1", "type": "choice", "label": "能否独立参与工作、购物或志愿者活动？", "options": [{"label":"独立","value":0},{"label":"需督促","value":0.5},{"label":"需协助","value":1},{"label":"完全不能","value":2}] },

        { "id": "inf_home_group", "type": "group", "label": "家庭生活与爱好" },
        { "id": "cdr_home_1", "type": "choice", "label": "家务能力（烹饪、清洁、爱好）？", "options": [{"label":"维持原状","value":0},{"label":"轻微放弃困难任务","value":0.5},{"label":"仅能做简单家务","value":1},{"label":"完全不做","value":2}] },

        { "id": "inf_care_group", "type": "group", "label": "个人生活自理" },
        { "id": "cdr_care_1", "type": "choice", "label": "进食、穿衣、个人卫生？", "options": [{"label":"完全自理","value":0},{"label":"需提醒","value":0.5},{"label":"需协助","value":1},{"label":"完全依赖","value":2}] }
      ]
    },
    {
      "id": "cdr_subject",
      "title": "B. 询问受试者 (Subject)",
      "fields": [
        { "id": "sub_memory_recent", "type": "text", "label": "请描述最近一周发生的一件有趣的事" },
        
        { "id": "sub_registration", "type": "info", "label": "请记住以下姓名和地址：李明、北京市、东城区、金三角、28号 (Li, Lei, Beijing, Jindasanjiao, 28)" },
        
        { "id": "sub_orientation_group", "type": "group", "label": "定向力测查" },
        { "id": "sub_ori_date", "type": "choice", "label": "今天是几号？", "options": [{"label":"正确","value":0},{"label":"错误","value":1}] },
        { "id": "sub_ori_place", "type": "choice", "label": "这里是什么地方？", "options": [{"label":"正确","value":0},{"label":"错误","value":1}] },
        
        { "id": "sub_judgment_group", "type": "group", "label": "判断力测查" },
        { "id": "sub_jud_diff", "type": "choice", "label": "萝卜和芹菜有什么相似之处？", "options": [{"label":"都是蔬菜 (正确)","value":0},{"label":"都是吃的/长地里 (部分)","value":0.5},{"label":"不知道/颜色不同 (错误)","value":1}] },
        { "id": "sub_jud_stamp", "type": "choice", "label": "如果捡到一个贴好邮票的信封，你会怎么做？", "options": [{"label":"投入邮筒 (正确)","value":0},{"label":"打开看/给警察 (部分)","value":0.5},{"label":"扔掉 (错误)","value":1}] },
        
        { "id": "sub_calc_group", "type": "group", "label": "计算力测查" },
        { "id": "sub_calc_1", "type": "choice", "label": "3 减 1 等于？", "options": [{"label":"2 (正确)","value":0},{"label":"错误","value":1}] },
        { "id": "sub_calc_2", "type": "choice", "label": "13 减 4 等于？", "options": [{"label":"9 (正确)","value":0},{"label":"错误","value":1}] },
        
        { "id": "sub_recall_group", "type": "group", "label": "延迟回忆 (姓名地址)" },
        { "id": "sub_recall_name", "type": "choice", "label": "刚才的人名？(李明)", "options": [{"label":"正确","value":0},{"label":"提示后正确","value":0.5},{"label":"错误","value":1}] },
        { "id": "sub_recall_addr", "type": "choice", "label": "刚才的地址？(北京市东城区...)", "options": [{"label":"全对","value":0},{"label":"部分对","value":0.5},{"label":"全错","value":1}] }
      ]
    }
  ]
};
