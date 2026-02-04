
import React, { useState } from 'react';
import Layout from './Layout';
import Button from './Button';
import { useApp } from '../context/AppContext';
import { SharingScope } from '../types';

interface PrivacyPanelProps {
  onBack: () => void;
}

// 蚂蚁阿福风格常量定义
const THEME_BLUE = '#1677FF';
const TEXT_PRIMARY = '#1E293B'; // Slate-800
const TEXT_SECONDARY = '#666666'; // 灰色辅助文案 
const TEXT_SIZE_LG = 'text-[24px]'; // 标题
const TEXT_SIZE_MD = 'text-[16px]'; // 正文
const TEXT_SIZE_SM = 'text-[14px]'; // 说明文案
const GAP_LG = 'gap-[24px]';
const GAP_MD = 'gap-[16px]';
const PADDING_CARD = 'p-[16px]';

export const PrivacyPanel: React.FC<PrivacyPanelProps> = ({ onBack }) => {
  const { state, dispatch } = useApp();
  const settings = state.user.privacySettings;

  // 模态框状态管理
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    content: string;
    targetScope?: SharingScope;
  }>({ visible: false, title: '', content: '' });

  // 处理分享范围切换请求
  const handleScopeChangeRequest = (scope: SharingScope) => {
    if (scope === settings.sharingScope) return;

    let content = '';
    let title = '确认修改权限？';

    switch (scope) {
      case SharingScope.ONLY_ME:
        content = '您确认将健康数据设置为“仅自己可见”吗？医生将无法查看您的历史数据，可能影响复诊判断。';
        break;
      case SharingScope.DOCTOR:
        content = '您确认将健康数据设置为“授权医生可见”吗？该权限仅用于华西及医联体医生进行诊疗服务。';
        break;
      case SharingScope.FAMILY:
        content = '您确认将健康数据设置为“家属可见”吗？绑定的亲情账号将能查看您的实时监测数据。';
        break;
    }

    setModalConfig({ visible: true, title, content, targetScope: scope });
  };

  // 确认修改分享范围
  const confirmScopeChange = () => {
    if (modalConfig.targetScope) {
      dispatch({
        type: 'UPDATE_PRIVACY_SETTINGS',
        payload: { sharingScope: modalConfig.targetScope }
      });
    }
    setModalConfig({ ...modalConfig, visible: false });
  };

  // 切换存储权限
  const toggleStorage = () => {
    dispatch({
      type: 'UPDATE_PRIVACY_SETTINGS',
      payload: { allowCloudStorage: !settings.allowCloudStorage }
    });
  };

  return (
    <Layout headerTitle="隐私与授权管理" showBack onBack={onBack}>
      <div className={`flex flex-col min-h-screen bg-[#F5F5F5] ${PADDING_CARD} space-y-[24px]`}>
        
        {/* 1. 数据授权总览卡片 */}
        <div className={`bg-white rounded-[16px] ${PADDING_CARD} shadow-sm border border-slate-100`}>
          <h2 className={`${TEXT_SIZE_LG} font-bold text-[${TEXT_PRIMARY}] mb-[8px]`}>数据授权总览</h2>
          <p className={`${TEXT_SIZE_SM} text-[${TEXT_SECONDARY}] mb-[16px]`}>
            您当前已授权 <span className={`text-[${THEME_BLUE}] font-bold`}>{settings.allowCloudStorage ? '2' : '1'}</span> 项核心权限
          </p>
          
          <div className="flex items-center justify-between bg-[#F8FAFC] rounded-[12px] p-[12px] mb-[8px]">
            <div className="flex items-center gap-[12px]">
              <div className="w-[32px] h-[32px] bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 text-[16px]">🛡️</div>
              <span className={`${TEXT_SIZE_MD} font-bold text-slate-700`}>隐私协议</span>
            </div>
            <span className="text-[12px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">已签署</span>
          </div>

          <div className="flex items-center justify-between bg-[#F8FAFC] rounded-[12px] p-[12px]">
            <div className="flex items-center gap-[12px]">
              <div className="w-[32px] h-[32px] bg-blue-50 rounded-full flex items-center justify-center text-[#1677FF] text-[16px]">☁️</div>
              <span className={`${TEXT_SIZE_MD} font-bold text-slate-700`}>云端存储</span>
            </div>
            <span className={`text-[12px] font-bold px-2 py-0.5 rounded ${settings.allowCloudStorage ? 'text-[#1677FF] bg-blue-50' : 'text-slate-400 bg-slate-200'}`}>
              {settings.allowCloudStorage ? '已开启' : '未开启'}
            </span>
          </div>
        </div>

        {/* 2. 分项权限设置 - 存储 */}
        <div className={`bg-white rounded-[16px] ${PADDING_CARD} shadow-sm border border-slate-100`}>
           <h3 className={`${TEXT_SIZE_MD} font-bold text-slate-900 mb-[16px]`}>数据存储授权</h3>
           
           <div className="bg-slate-50 p-[12px] rounded-[8px] mb-[16px]">
               <p className={`${TEXT_SIZE_SM} text-[${TEXT_SECONDARY}] leading-relaxed`}>
                   您的医疗数据将采用 AES-256 标准加密存储，仅您本人与授权医生可查看，平台不会用于任何商业广告推送。
               </p>
           </div>

           <div className="flex justify-between items-center">
               <div>
                   <div className="font-bold text-slate-800">加密云备份</div>
                   <div className="text-[12px] text-slate-400 mt-0.5">防止更换设备导致数据丢失</div>
               </div>
               {/* 仿 iOS/Alipay 风格开关 */}
               <button 
                  onClick={toggleStorage}
                  className={`w-[48px] h-[28px] rounded-full relative transition-colors duration-300 ${settings.allowCloudStorage ? `bg-[${THEME_BLUE}]` : 'bg-slate-200'}`}
               >
                   <div className={`absolute top-[2px] left-[2px] w-[24px] h-[24px] bg-white rounded-full shadow-md transition-transform duration-300 ${settings.allowCloudStorage ? 'translate-x-[20px]' : 'translate-x-0'}`}></div>
               </button>
           </div>
        </div>

        {/* 3. 分项权限设置 - 分享 */}
        <div className={`bg-white rounded-[16px] ${PADDING_CARD} shadow-sm border border-slate-100`}>
            <h3 className={`${TEXT_SIZE_MD} font-bold text-slate-900 mb-[16px]`}>基础分享权限设置</h3>
            
            <div className="bg-slate-50 p-[12px] rounded-[8px] mb-[16px]">
               <p className={`${TEXT_SIZE_SM} text-[${TEXT_SECONDARY}] leading-relaxed`}>
                   您选择的分享范围仅适用于对应角色，我们不会向未授权方泄露您的任何数据。请根据实际就医需求谨慎选择。
               </p>
            </div>

            <div className={`flex flex-col ${GAP_MD}`}>
                {/* 选项 1: 仅自己 */}
                <label className="flex items-start gap-[12px] cursor-pointer group">
                    <div className="relative pt-1">
                        <input 
                            type="radio" 
                            name="scope" 
                            checked={settings.sharingScope === SharingScope.ONLY_ME}
                            onChange={() => handleScopeChangeRequest(SharingScope.ONLY_ME)}
                            className="peer sr-only" 
                        />
                        <div className={`w-[20px] h-[20px] rounded-full border-2 border-slate-300 peer-checked:border-[${THEME_BLUE}] peer-checked:bg-[${THEME_BLUE}] transition-all flex items-center justify-center`}>
                            <div className="w-[8px] h-[8px] bg-white rounded-full opacity-0 peer-checked:opacity-100"></div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className={`font-bold ${settings.sharingScope === SharingScope.ONLY_ME ? `text-[${THEME_BLUE}]` : 'text-slate-800'}`}>仅自己可见</div>
                        <p className={`${TEXT_SIZE_SM} text-slate-400 mt-[4px]`}>您的健康数据仅您本人可查看，无任何外部访问权限。</p>
                    </div>
                </label>

                <div className="h-px bg-slate-100 w-full"></div>

                {/* 选项 2: 授权医生 */}
                <label className="flex items-start gap-[12px] cursor-pointer group">
                    <div className="relative pt-1">
                        <input 
                            type="radio" 
                            name="scope"
                            checked={settings.sharingScope === SharingScope.DOCTOR}
                            onChange={() => handleScopeChangeRequest(SharingScope.DOCTOR)}
                            className="peer sr-only" 
                        />
                        <div className={`w-[20px] h-[20px] rounded-full border-2 border-slate-300 peer-checked:border-[${THEME_BLUE}] peer-checked:bg-[${THEME_BLUE}] transition-all flex items-center justify-center`}>
                            <div className="w-[8px] h-[8px] bg-white rounded-full opacity-0 peer-checked:opacity-100"></div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className={`font-bold ${settings.sharingScope === SharingScope.DOCTOR ? `text-[${THEME_BLUE}]` : 'text-slate-800'}`}>授权医生可见</div>
                        <p className={`${TEXT_SIZE_SM} text-slate-400 mt-[4px]`}>您的健康数据仅授权的华西及协作医院医生可查看，用于复诊参考。</p>
                    </div>
                </label>

                <div className="h-px bg-slate-100 w-full"></div>

                {/* 选项 3: 家属可见 */}
                <label className="flex items-start gap-[12px] cursor-pointer group">
                    <div className="relative pt-1">
                        <input 
                            type="radio" 
                            name="scope"
                            checked={settings.sharingScope === SharingScope.FAMILY}
                            onChange={() => handleScopeChangeRequest(SharingScope.FAMILY)}
                            className="peer sr-only" 
                        />
                        <div className={`w-[20px] h-[20px] rounded-full border-2 border-slate-300 peer-checked:border-[${THEME_BLUE}] peer-checked:bg-[${THEME_BLUE}] transition-all flex items-center justify-center`}>
                            <div className="w-[8px] h-[8px] bg-white rounded-full opacity-0 peer-checked:opacity-100"></div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className={`font-bold ${settings.sharingScope === SharingScope.FAMILY ? `text-[${THEME_BLUE}]` : 'text-slate-800'}`}>家属可见</div>
                        <p className={`${TEXT_SIZE_SM} text-slate-400 mt-[4px]`}>您的健康数据仅已绑定的亲情账号家属可查看，用于远程看护。</p>
                    </div>
                </label>
            </div>
        </div>
      </div>

      {/* 二次确认弹窗 (蚂蚁风格) */}
      {modalConfig.visible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-[24px]">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalConfig({...modalConfig, visible: false})}></div>
            <div className="bg-white w-full max-w-[320px] rounded-[16px] p-[24px] relative z-10 animate-slide-up text-center">
                <h3 className={`${TEXT_SIZE_LG} font-bold text-slate-900 mb-[16px]`}>{modalConfig.title}</h3>
                <p className={`${TEXT_SIZE_SM} text-[${TEXT_SECONDARY}] mb-[24px] leading-relaxed`}>
                    {modalConfig.content}
                </p>
                <div className="flex gap-[12px]">
                    <Button fullWidth variant="outline" onClick={() => setModalConfig({...modalConfig, visible: false})} className="border-slate-200 text-slate-600">
                        取消
                    </Button>
                    <Button fullWidth onClick={confirmScopeChange} className={`bg-[${THEME_BLUE}] shadow-lg shadow-blue-500/30`}>
                        确认修改
                    </Button>
                </div>
            </div>
        </div>
      )}

    </Layout>
  );
};

export default PrivacyPanel;
