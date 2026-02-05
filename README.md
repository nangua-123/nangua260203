
# Neuro-Link (华西神经专病AI数字医院)

## 1. 项目愿景 (Project Vision)
本项目致力于构建一个**符合华西医院神经内科临床标准**的 C 端数字医疗服务平台。
核心理念：**“极简准入，专业分流”**。
系统集成了 **AI CDSS（临床决策支持系统）**、**多角色账户体系（RBAC）**、**数字疗法（游戏/监测）**以及**医联体分级诊疗**，旨在为偏头痛、癫痫及认知障碍患者提供全生命周期的慢病管理服务。

---

## 2. 代码架构与目录索引 (Architecture & Source Map)

项目采用 **Feature-based** 与 **Layer-based** 混合架构，明确区分了页面视图、通用组件与业务逻辑。

### 📂 Root & Config (根目录配置)
*   **`App.tsx`**: 应用主入口。负责全局路由分发 (`currentView` state)、深层链接监听及离线状态检测。
*   **`types/index.ts`**: 类型定义中心。包含 `User`, `DiseaseType`, `FeatureKey` (SKU) 及详细的病历结构定义。
*   **`metadata.json`**: 应用权限与元数据配置。

### 📂 Pages (页面视图层)
> 位于 `pages/` 目录，负责组装组件并处理顶层页面逻辑。
*   **`LoginView.tsx`**: **统一登录入口**。支持手机/微信/支付宝一键登录，无感跳转至 AI 问诊。
*   **`HomeView.tsx`**: **综合仪表盘**。包含健康分水波球、IoT 设备状态监控 (Canvas 动画)、SOS 紧急呼救入口。
*   **`ChatView.tsx`**: **AI 问诊主界面**。
    *   集成 `geminiService` 实现多轮问诊。
    *   包含动态进度条与软性付费引导 (Soft Offer)。
    *   **[Fix]**: 修复了付费测评弹窗的唤起与支付成功后的跳转逻辑。
*   **`AssessmentView.tsx`**: **专业量表测评**。根据病种动态加载 MIDAS / AD8 / 癫痫筛查量表。
*   **`ReportView.tsx`**: **诊断报告**。根据风险分值渲染 红/黄/绿 分级报告及干预建议。
*   **`ProfileView.tsx`**: **个人中心**。集成了后置角色管理入口、家庭代管二维码、隐私设置。

### 📂 Components (组件层)

#### 🧩 Common (通用原子组件)
> 位于 `components/common/`
*   **`Button.tsx`**: 封装了 Ant Design 风格的交互按钮 (Primary/Outline/Ghost)。
*   **`Layout.tsx`**: 标准页面容器，处理安全区 (Safe Area) 与导航栏。
*   **`BottomNav.tsx`**: 底部全局导航栏。

#### 💼 Business (业务核心组件)
> 位于 `components/business/`，封装特定医学/商业规则。
*   **`headache/DigitalPrescription.tsx`**: **数字处方看板**。
    *   逻辑：MOH (药物过度使用) 预警、生活方式干预排序、处方有效期校验。
*   **`epilepsy/WaveMonitor.tsx`**: **脑电监测图表**。
    *   技术：60FPS Canvas/SVG 渲染，模拟异常棘慢波 (Spike Wave) 及断连状态机。
*   **`payment/PaywallModal.tsx`**: **通用支付墙**。
    *   支持权益对比、优惠券选择、模拟支付网关回调。
*   **`ReferralSystem.tsx`**: **转诊通行证**。
    *   逻辑：基于 CDSS 规则拦截不合规转诊理由，生成防伪二维码。

#### 📦 Features (功能模块)
> 位于 `components/`
*   **`HealthServices.tsx`**: 专病服务详情页容器 (偏头痛/癫痫/认知障碍)。
*   **`ServiceMarketplace.tsx`**: 服务商城与 HaaS 硬件租赁收银台。
*   **`CognitiveGames.tsx`**: 数字疗法 (视觉记忆/舒尔特方格)。
*   **`RoleManager.tsx`**: 多角色身份切换与绑定管理器。
*   **`PrivacyPanel.tsx`**: 数据隐私与共享范围设置。
*   **`FamilyManagedModal.tsx`**: 家属代管二维码生成器。

### 📂 Logic Layer (逻辑服务层)
*   **`context/AppContext.tsx`**: **全局状态机**。
    *   管理用户鉴权、角色切换、家庭成员 CRUD、敏感数据脱敏。
*   **`services/geminiService.ts`**: **AI CDSS 核心 (Mock)**。
    *   包含**动态风险评分**逻辑，NLP 意图识别与病种分流。
*   **`hooks/usePayment.ts`**: **商业化中台**。
    *   定义 SKU、优惠券核销、HaaS 租赁计价。
*   **`hooks/useRole.ts`**: **RBAC 权限控制器** (Patient/Family/Doctor)。

---

## 3. 核心业务流程 (Key Workflows)

### 3.1 极简登录与问诊 (Unified Auth & Triage)
1.  **用户进入**: `LoginView` 提供手机/第三方一键登录。
2.  **身份分发**: 系统默认赋予 `PATIENT` 角色，并**立即跳转**至 `ChatView`。
3.  **AI 接诊**: `geminiService` 初始化，AI 主动发起第一轮询问。
4.  **动态分流**: 基于用户回复（如“头痛”），AI 自动切换至对应的专病知识库。
5.  **付费转化**: 问诊结束后，`ChatView` 唤起 `PaywallModal` 引导深度测评。

### 3.2 后置角色管理 (Post-Login RBAC)
1.  **入口**: 用户在 `ProfileView` 点击“我的角色管理”。
2.  **操作**: 唤起 `RoleManager` 组件。
    *   **切换**: 在已绑定的 Patient/Family/Doctor 身份间无缝切换。
    *   **新增**:
        *   **家属**: 点击“扫码关联” -> 扫描患者 `FamilyManagedModal` 的二维码 -> 绑定成功。
        *   **医助**: 上传资质证明 -> 等待审核 (Mock)。

### 3.3 商业化闭环 (Commercialization)
1.  **触发**: 用户点击 VIP 功能（如“导出病历”、“HaaS 租赁”）。
2.  **鉴权**: `usePayment` 检查 `unlockedFeatures`。
3.  **支付**: 唤起 `PaywallModal` -> 选择优惠券 -> 模拟支付网关 -> 成功解锁 -> 写入全局状态。

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

## 5. 变更日志 (Change Log)

### [Current Version] - [Refactoring & Fixes]
*   **[Refactor]**: 全面重构目录结构，将视图文件迁移至 `pages/`，通用组件迁移至 `components/common/`，业务组件迁移至 `components/business/`，实现高内聚低耦合。
*   **[Feature]**: `ChatView` 逻辑修复：
    *   修正了问诊结束后付费弹窗不显示的问题。
    *   实现了支付成功后自动跳转至 `AssessmentView` (测评页) 的事件链路。
*   **[Optimization]**: 优化了 `App.tsx` 的路由渲染逻辑，移除死循环跳转，增强了离线状态检测提示。
*   **[Architecture]**: 统一类型定义至 `types/index.ts`，规范了 `UserRole` 和 `AuthProvider` 等枚举的使用。

### [Previous] - [Health Services Module]
*   **Feature**: `WaveMonitor` 新增蓝牙连接状态机，支持模拟设备断连 (HS-003)。
*   **Feature**: `EpilepsyServiceView` 新增“断连手动降级”模式。
*   **Optimization**: `DigitalPrescription` 增强交互反馈 (HS-001) 及动态 MOH 预警 (HS-009)。
