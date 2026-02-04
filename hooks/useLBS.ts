
import { useState, useEffect } from 'react';
import { ReferralData } from '../types';

interface LBSResult {
  hospitalName: string;
  distance: string;
  address: string;
  isCollaborating: boolean;
  loading: boolean;
  error: string | null;
  // 辅助方法：快速生成当前位置的转诊数据模板
  generateReferralTemplate: () => Omit<ReferralData, 'recommends' | 'qrCodeValue'>;
}

export const useLBS = () => {
  const [location, setLocation] = useState<Omit<LBSResult, 'generateReferralTemplate'>>({
    hospitalName: '定位中...',
    distance: '',
    address: '',
    isCollaborating: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const fetchLocation = async () => {
      try {
        // 模拟网络请求延迟
        await new Promise(resolve => setTimeout(resolve, 600));

        if (!mounted) return;

        // Mock: 假设用户在成都市高新区
        setLocation({
          hospitalName: '四川大学华西医院 (认证协作)',
          distance: '2.3km',
          address: '成都市武侯区国学巷37号',
          isCollaborating: true,
          loading: false,
          error: null,
        });

      } catch (e) {
        if (!mounted) return;
        setLocation({
          hospitalName: '无法获取位置',
          distance: '-',
          address: '-',
          isCollaborating: false,
          loading: false,
          error: '定位权限未开启',
        });
      }
    };

    fetchLocation();

    return () => {
      mounted = false;
    };
  }, []);

  const generateReferralTemplate = () => ({
    hospitalName: location.hospitalName,
    distance: location.distance,
    address: location.address
  });

  return { ...location, generateReferralTemplate };
};
