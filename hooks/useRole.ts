
/**
 * @file useRole.ts
 * @description 角色权限管理 Hook (RBAC Core)
 * @author Neuro-Link Architect
 * 
 * 职责：
 * 1. 定义不同角色(Patient/Family/Doctor)的权限矩阵。
 * 2. 提供 hasPermission 方法供 UI 组件调用。
 * 3. 封装角色判断快捷属性 (isFamily, isDoctor)。
 */

import { useApp } from '../context/AppContext';
import { UserRole, Permission } from '../types';

// 权限矩阵定义
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    [UserRole.PATIENT]: [
        'VIEW_ALL_DATA',
        'EDIT_PRESCRIPTION',
        'MANAGE_FAMILY',
        'GENERATE_QR',
        'RECEIVE_ALERTS'
    ],
    [UserRole.FAMILY]: [
        'VIEW_LIMITED_DATA', // 仅查看基础数据
        'RECEIVE_ALERTS',    // 接收预警
        'MANAGE_FAMILY'      // 切换家庭成员
        // 无 EDIT_PRESCRIPTION 权限
    ],
    [UserRole.DOCTOR_ASSISTANT]: [
        'VIEW_LIMITED_DATA', // 医助也只能看授权数据
        'SYNC_DATA',         // 同步数据
        'WRITE_FOLLOW_UP'    // 填写随访
    ]
};

export const useRole = () => {
    const { state } = useApp();
    const { user } = state;

    /**
     * 核心权限校验函数
     * @param permission 需请求的权限
     * @returns boolean 是否允许
     */
    const checkPermission = (permission: Permission): boolean => {
        const allowedPermissions = ROLE_PERMISSIONS[user.role] || [];
        return allowedPermissions.includes(permission);
    };

    // 快捷判断
    const isPatient = user.role === UserRole.PATIENT;
    const isFamily = user.role === UserRole.FAMILY;
    const isDoctor = user.role === UserRole.DOCTOR_ASSISTANT;

    // AD 家属代管模式特定逻辑
    // 如果是家属角色，且当前查看的是他人档案，则视为代管模式
    const isManagedMode = isFamily && user.associatedPatientId;

    return {
        role: user.role,
        isPatient,
        isFamily,
        isDoctor,
        isManagedMode,
        checkPermission,
        permissions: ROLE_PERMISSIONS[user.role]
    };
};
