
# Neuro-Link (华西神经专病 AI 数字医院)

[![Medical Grade](https://img.shields.io/badge/Medical-Class%20II-blue)](https://www.wchscu.cn/)
[![Privacy](https://img.shields.io/badge/Data-AES256-green)](https://www.w3.org/TR/webcrypto/)
[![Style](https://img.shields.io/badge/UI-Ant%20Design%20Mobile-1677FF)](https://mobile.ant.design/)

> **"极简准入，专业分流，全病程闭环"**
> 
> 基于 Google Gemini AI 构建的神经内科慢病管理系统 (CDSS)。严格遵循华西医院临床科研表单 (CRF) 标准，融合 C 端极简体验与 B 端医疗严谨性。

---

## 📱 设计哲学 (Design System)

本项目 UI/UX 深度致敬 **Ant Design Mobile (Alipay Style)**，强调：

*   **克制与留白**：使用 `#F5F5F5` 浅灰背景与卡片式布局，减少视觉噪点。
*   **医疗信任色**：主色调 `Brand Blue (#1677FF)` 传递专业感，高危预警使用 `Standard Red (#FF4D4F)`。
*   **适老交互**：全站支持“长辈模式”，触控热区 `>= 44px`，字体动态缩放。
*   **情感化反馈**：关键操作（如支付、SOS）伴随微动效与触感反馈 (Haptic)。

---

## 🏗 代码架构 (Source Map)

项目采用 **Feature-based** 混合架构，核心业务由配置引擎驱动。

### 📂 Root
*   `App.tsx`: 全局路由分发、离线检测、`GlobalSOS` 挂载点。
*   `types/index.ts`: **SSOT (Single Source of Truth)** 类型定义中心。
*   `metadata.json`: 权限配置。

### 📂 Config Engine (临床配置引擎)
> 位于 `config/`，实现医学逻辑的低代码化 (Low-Code)。
*   `triage_config.ts`: AI 初诊分流决策树 (Triage Decision Tree)。
*   `DiseaseContextConfig.ts`: 病种上下文 (AI 人设、阈值、推荐工具)。
*   **`forms/` (CRF 表单配置)**:
    *   **癫痫**: `epilepsy_v0_config.ts` (基线), `epilepsy_followup_configs.ts` (V1-V5 随访)。
    *   **认知 (AD)**: `cognitive_assessment_config.ts` (综合套件), `cognitive_cdr_config.ts` (CDR 双盲) 等。

### 📂 Pages (视图层)
*   `LoginView.tsx`: 统一登录 (手机/微信/支付宝)，含验证码倒计时。
*   `HomeView.tsx`: 仪表盘。集成健康分水波球、IoT 状态、医嘱任务流。
*   `ChatView.tsx`: AI 问诊。支持语义匹配、熔断机制、软性付费引导。
*   `AssessmentView.tsx`: **通用测评引擎**。解析 JSON 配置动态渲染复杂量表 (含倒计时挂起)。
*   `ReportView.tsx`: 诊断报告。集成 CSI 算法、Chart.js 趋势图、AES 加密通行证。
*   `ProfileView.tsx`: 个人中心。全病程时间轴 (Journey Timeline)、角色切换。

### 📂 Components (组件层)

#### 🧬 Feature Modules (核心功能)
*   `InteractiveMMSE.tsx`: 交互式 MMSE 筛查 (定向/记忆/计算)。
*   `CognitiveGames.tsx`: 数字疗法 (视觉记忆/舒尔特方格)。
*   **`TMTBGame.tsx`**: **TMT-B 连线测试**。Canvas 实现，支持逻辑校验与计时熔断。
*   `HealthServices.tsx`: 专病服务详情页容器。
*   `ServiceMarketplace.tsx`: 服务商城与 HaaS 收银台。
*   `RoleManager.tsx`: RBAC 多角色切换与绑定。
*   `PrivacyPanel.tsx`: 数据隐私与共享范围设置。
*   `GlobalSOS.tsx`: 系统级红色警报覆盖层 (Web Audio + Canvas Animation)。

#### 💼 Business Widgets (业务组件)
*   `business/ReferralSystem.tsx`: **转诊通行证** (AES-256 加密二维码)。
*   `business/headache/`: 
    *   `DigitalPrescription.tsx`: 数字处方与 MOH 熔断。
    *   `NonDrugToolkit.tsx`: 非药物干预工具箱。
*   `business/epilepsy/`: 
    *   `WaveMonitor.tsx`: 60FPS 脑电波形渲染。
*   `business/profile/`: 
    *   `HardwareStatus.tsx`: HaaS 设备状态监控。

### 📂 Services & Utils
*   `services/geminiService.ts`: **AI Core**。集成 Google Gemini，支持语义模糊匹配。
*   `utils/scoringEngine.ts`: **医学评分引擎**。实现 MMSE/MoCA/CDR/ADL 复杂计分逻辑。
*   `hooks/`: 
    *   `useIoTSimulation.ts`: IoT 数据流模拟 (心率/跌倒/离线)。
    *   `useRole.ts`: RBAC 权限控制。
    *   `usePayment.ts`: SKU 定义与模拟支付网关。

---

## 🩺 核心医学逻辑 (Medical Logic)

### 1. 癫痫闭环 (Epilepsy Loop)
*   **分型标准**: 严格遵循 ILAE 2017 分类 (局灶/全面/未知)。
*   **随访管理**: V0 基线 -> V1-V5 自动计算窗口期，支持 TDM (血药浓度) 补录。
*   **安全围栏**: `useIoTSimulation` 实时监测心率变异度 (HRV) 与跌倒信号，触发三级熔断。

### 2. 认知障碍筛查 (AD/MCI)
*   **双盲评估**: CDR 量表强制区分知情者 (`Informant`) 与受试者 (`Subject`) 独立作答。
*   **任务挂起**: AVLT-H 记忆测试内置 5min/20min 绝对时间锁，防止作弊。
*   **数字疗法**: TMT-B (执行功能) 与舒尔特方格 (注意力) 游戏化评估。

### 3. 偏头痛管理 (Migraine)
*   **MOH 熔断**: 24小时内用药 >3 次强制弹窗警告，预防药物过度使用性头痛。
*   **诱因雷达**: 结合 LBS 气象数据 (气压/温度) 与用户行为生成 CSI (临床稳定性指数)。

---

## 🛡 数据安全与合规 (Security & Compliance)

| 审计项 | 技术实现 |
| :--- | :--- |
| **数据脱敏** | 前端自动 Masking 身份证/手机号 (e.g., `138****0000`) |
| **存储加密** | 核心病历生成 `ClinicalPassport` JSON 后经 **AES-256** 加密生成二维码 |
| **访问控制** | 基于 RBAC 的严格权限矩阵 (患者/家属/医助)，支持家属代管模式 |
| **知情同意** | 关键操作 (如录音、上传) 前置隐私授权弹窗 |

---

## 🚀 快速开始 (Quick Start)

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

*注：本项目需配置 `VITE_GEMINI_API_KEY` 环境变量以启用 AI 功能。*

---

© 2024 Neuro-Link Team | Powered by West China Hospital CDSS
