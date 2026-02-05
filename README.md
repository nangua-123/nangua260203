
# Neuro-Link (华西神经专病AI数字医院)

## 1. 项目愿景 (Project Vision)
本项目致力于构建一个**符合华西医院神经内科临床标准**的 C 端数字医疗服务平台。
核心理念：**“极简准入，专业分流”**。
系统集成了 **AI CDSS（临床决策支持系统）**、**多角色账户体系（RBAC）**、**数字疗法（游戏/监测）**以及**医联体分级诊疗**，旨在为偏头痛、癫痫及认知障碍患者提供全生命周期的慢病管理服务。

---

## 2. 代码架构与目录索引 (Architecture & Source Map)

项目采用 **Feature-based** 与 **Layer-based** 混合架构，确保业务逻辑高内聚。

### 📂 Core (核心层)
> 应用的骨架，负责路由、状态管理与类型定义。
*   **`App.tsx`**: 应用主入口。负责全局路由分发、深层链接 (Deep Link) 监听及“一键登录”后的逻辑跳转。
*   **`types.ts`**: 类型定义中心。包含 User, DiseaseType, FeatureKey (SKU) 及详细的病历结构定义。
*   **`context/AppContext.tsx`**: 全局状态机。
    *   **核心职责**: 用户鉴权状态、多角色身份切换 (Switch Role)、家庭成员 CRUD、敏感数据脱敏。
    *   **状态持久化**: 自动同步至 LocalStorage。

### 📂 Services & Hooks (逻辑服务层)
> 抽离 UI 无关的业务逻辑，实现复用与解耦。
*   **`services/geminiService.ts`**: **AI CDSS 核心**。
    *   采用 Mock 状态机模拟多轮问诊。
    *   包含**动态风险评分 (Dynamic Risk Scoring)** 逻辑，根据用户输入的关键词（如“剧烈”、“抽搐”）实时调整分值。
    *   负责 NLP 意图识别与病种分流 (Triage)。
*   **`hooks/usePayment.ts`**: **商业化中台**。
    *   定义 SKU (服务包) 与 Pricing (价格体系)。
    *   实现**优惠券核销**、**HaaS 硬件租赁阶梯计价**。
    *   集成 **Mock Payment Gateway**，含随机故障注入 (20% 失败率) 以测试前端容错性。
*   **`hooks/useRole.ts`**: **RBAC 权限控制器**。
    *   定义 `PATIENT` (全权)、`FAMILY` (受限)、`DOCTOR` (数据同步) 三类角色的权限矩阵。
*   **`hooks/useTriage.ts`** & **`hooks/useLBS.ts`**: 分诊与位置服务逻辑。

### 📂 Components (组件视图层)

#### 3.1 Views (页面级组件)
*   **`LoginView.tsx`**: **统一登录入口**。支持手机/微信/支付宝一键登录，无感跳转至 AI 问诊。
*   **`ChatView.tsx`**: **AI 问诊主界面**。实现打字机效果、动态进度条、软性付费引导 (Soft Offer)。
*   **`HomeView.tsx`**: **综合仪表盘**。包含健康分水波球、IoT 设备状态监控、SOS 紧急呼救入口。
*   **`ProfileView.tsx`**: **个人中心**。集成了**后置角色管理**入口、家庭代管二维码、隐私设置。
*   **`ReportView.tsx`**: **诊断报告**。根据风险分值渲染 红/黄/绿 分级报告及干预建议。
*   **`HealthServices.tsx`**: **专病服务详情页**。偏头痛/癫痫/认知障碍的子功能容器。
*   **`ServiceMarketplace.tsx`**: **服务商城**。硬件租赁收银台与权益购买中心。

#### 3.2 Features (功能级组件)
*   **`RoleManager.tsx`**: **[核心] 角色管理器**。
    *   位于“我的”页面，支持**多身份切换**、**家属扫码关联**、**医助资质上传**。
*   **`CognitiveGames.tsx`**: **数字疗法**。包含“视觉记忆”与“舒尔特方格”游戏，用于 AD 患者康复。
*   **`PrivacyPanel.tsx`**: **隐私设置**。管理数据云同步与医生查看权限。
*   **`FamilyManagedModal.tsx`**: **代管二维码**。生成用于家属绑定的动态 Token 二维码。

#### 3.3 Business Widgets (业务微件 - 高内聚)
> 位于 `components/business/` 目录，封装特定医学/商业规则。
*   **`business/headache/DigitalPrescription.tsx`**: **数字处方看板**。
    *   逻辑：MOH (药物过度使用) 预警、生活方式干预排序、处方有效期/医师资质校验。
*   **`business/epilepsy/WaveMonitor.tsx`**: **脑电监测图表**。
    *   技术：60FPS Canvas/SVG 渲染，模拟异常棘慢波 (Spike Wave) 动画。
*   **`business/ReferralSystem.tsx`**: **转诊通行证**。
    *   逻辑：基于 CDSS 规则拦截不合规转诊理由，生成防伪二维码。
*   **`business/payment/PaywallModal.tsx`**: **通用支付墙**。
    *   支持权益对比、优惠券选择、异常状态重试 (Retry)。

---

## 3. 核心业务流程 (Key Workflows)

### 3.1 极简登录与问诊 (Unified Auth & Triage)
1.  **用户进入**: `LoginView` 提供手机/第三方一键登录。
2.  **身份分发**: 系统默认赋予 `PATIENT` 角色，并**立即跳转**至 `ChatView`。
3.  **AI 接诊**: `geminiService` 初始化，AI 主动发起第一轮询问。
4.  **动态分流**: 基于用户回复（如“头痛”），AI 自动切换至对应的专病知识库（头痛/癫痫/认知）。

### 3.2 后置角色管理 (Post-Login RBAC)
1.  **入口**: 用户在 `ProfileView` 点击“我的角色管理”。
2.  **操作**: 唤起 `RoleManager` 组件。
    *   **切换**: 在已绑定的 Patient/Family/Doctor 身份间无缝切换。
    *   **新增**:
        *   **家属**: 点击“扫码关联” -> 扫描患者 `FamilyManagedModal` 的二维码 -> 绑定成功。
        *   **医助**: 上传资质证明 -> 等待审核 (Mock)。

### 3.3 商业化闭环 (Commercialization)
1.  **触发**: 用户点击 VIP 功能（如“导出病历”、“查看历史脑电”）。
2.  **鉴权**: `usePayment` 检查 `unlockedFeatures`。
3.  **支付**: 唤起 `PaywallModal` -> 选择优惠券 -> 模拟支付网关 (含随机失败) -> 成功解锁 -> 写入全局状态。

---

## 4. 审计合规性 (Compliance Audit)

| 审计项 | 实现方案 | 状态 |
| :--- | :--- | :--- |
| **适老化设计** | 全局大字体支持，高对比度配色 (#1677FF / #EF4444) | ✅ |
| **数据隐私** | `PrivacyPanel` 提供“仅自己可见/医生可见”粒度控制 | ✅ |
| **医疗免责** | 首页底部、测评页、报告页均包含醒目的免责声明 | ✅ |
| **紧急避险** | 高危状态下 (Risk>60) 强制弹窗提醒就医，提供 SOS 一键呼叫 | ✅ |
| **非强迫交易** | 支付墙提供“跳过”或“免费基础版”选项，不阻断核心医疗流程 | ✅ |
| **转诊规范** | `ReferralSystem` 内置华西转诊标准校验规则 | ✅ |

---

## 5. 开发规范 (Development Standards)

*   **UI 规范**: 严格遵循 Tailwind CSS 原子类，主色调统一为 `brand-500` (#1677FF)，警告色 `rose-500`。
*   **状态管理**: 禁止组件内部直接修改 `user` 对象，必须通过 `dispatch({ type: 'ACTION', ... })`。
*   **Mock 数据**: 所有模拟数据（AI回复、IoT波形、支付结果）均在 Service/Hook 层产生，UI 层只负责渲染，不包含随机逻辑。
*   **TypeScript**: 严禁使用 `any`，所有业务实体必须在 `types.ts` 中定义接口。

---

## 6. 变更日志 (Change Log)

### [2024-05-22] - [登录体验优化]
*   **Optimization**: 移除了 `LoginView` 表单的所有正则校验，实现“一键免验证登录”。
*   **Fix**: 修复了登录页背景元素层级过高导致按钮无法点击的 Z-Index 问题。
*   **Feature**: 优化了 `handleGetCode` 逻辑，点击即自动填入演示验证码。
