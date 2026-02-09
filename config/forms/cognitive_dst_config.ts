
import { FormConfig } from "../../types";

export const COGNITIVE_DST_CONFIG: FormConfig = {
  id: "dst_backward",
  title: "数字广度测验-倒背 (DST Backward)",
  version: "WCH-CRF-2024",
  sections: [
    {
      id: "dst_intro",
      title: "测试指导",
      fields: [
        {
          id: "dst_instruction_text",
          type: "info",
          label: "【指导语】现在我要说一些数字，我希望你可以倒序把他们说出来。比如我说 7-1-9，你应该说 9-1-7。",
          hint: "语速要求：每秒 1 个数字，匀速，中间不可间断。"
        }
      ]
    },
    {
      id: "dst_item_1",
      title: "Item 1 (2位)",
      fields: [
        { id: "dst_1a", type: "choice", label: "a. 2-4", hint: "正确答案: 4-2", options: [{label: "正确 (1)", value: 1}, {label: "错误 (0)", value: 0}] },
        { id: "dst_1b", type: "choice", label: "b. 5-7", hint: "正确答案: 7-5", options: [{label: "正确 (1)", value: 1}, {label: "错误 (0)", value: 0}] }
      ]
    },
    {
      id: "dst_item_2",
      title: "Item 2 (3位)",
      fields: [
        { id: "dst_2a", type: "choice", label: "a. 6-2-9", hint: "正确答案: 9-2-6", options: [{label: "正确 (1)", value: 1}, {label: "错误 (0)", value: 0}] },
        { id: "dst_2b", type: "choice", label: "b. 4-1-5", hint: "正确答案: 5-1-4", options: [{label: "正确 (1)", value: 1}, {label: "错误 (0)", value: 0}] }
      ]
    },
    {
      id: "dst_item_3",
      title: "Item 3 (4位)",
      fields: [
        { id: "dst_3a", type: "choice", label: "a. 3-2-7-9", hint: "正确答案: 9-7-2-3", options: [{label: "正确 (1)", value: 1}, {label: "错误 (0)", value: 0}] },
        { id: "dst_3b", type: "choice", label: "b. 4-9-6-8", hint: "正确答案: 8-6-9-4", options: [{label: "正确 (1)", value: 1}, {label: "错误 (0)", value: 0}] }
      ]
    },
    {
      id: "dst_item_4",
      title: "Item 4 (5位)",
      fields: [
        { id: "dst_4a", type: "choice", label: "a. 1-5-2-8-6", hint: "正确答案: 6-8-2-5-1", options: [{label: "正确 (1)", value: 1}, {label: "错误 (0)", value: 0}] },
        { id: "dst_4b", type: "choice", label: "b. 6-1-8-4-3", hint: "正确答案: 3-4-8-1-6", options: [{label: "正确 (1)", value: 1}, {label: "错误 (0)", value: 0}] }
      ]
    },
    {
      id: "dst_item_5",
      title: "Item 5 (6位)",
      fields: [
        { id: "dst_5a", type: "choice", label: "a. 5-3-9-4-1-8", hint: "正确答案: 8-1-4-9-3-5", options: [{label: "正确 (1)", value: 1}, {label: "错误 (0)", value: 0}] },
        { id: "dst_5b", type: "choice", label: "b. 7-2-4-8-5-6", hint: "正确答案: 6-5-8-4-2-7", options: [{label: "正确 (1)", value: 1}, {label: "错误 (0)", value: 0}] }
      ]
    },
    {
      id: "dst_item_6",
      title: "Item 6 (7位)",
      fields: [
        { id: "dst_6a", type: "choice", label: "a. 8-1-2-9-3-6-5", hint: "正确答案: 5-6-3-9-2-1-8", options: [{label: "正确 (1)", value: 1}, {label: "错误 (0)", value: 0}] },
        { id: "dst_6b", type: "choice", label: "b. 4-7-3-9-1-2-8", hint: "正确答案: 8-2-1-9-3-7-4", options: [{label: "正确 (1)", value: 1}, {label: "错误 (0)", value: 0}] }
      ]
    },
    {
      id: "dst_item_7",
      title: "Item 7 (8位)",
      fields: [
        { id: "dst_7a", type: "choice", label: "a. 9-4-3-7-6-2-5-8", hint: "正确答案: 8-5-2-6-7-3-4-9", options: [{label: "正确 (1)", value: 1}, {label: "错误 (0)", value: 0}] },
        { id: "dst_7b", type: "choice", label: "b. 7-2-8-1-9-6-5-3", hint: "正确答案: 3-5-6-9-1-8-2-7", options: [{label: "正确 (1)", value: 1}, {label: "错误 (0)", value: 0}] }
      ]
    }
  ]
};
