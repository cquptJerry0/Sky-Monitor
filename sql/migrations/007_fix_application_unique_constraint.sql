-- ============================================
-- 修复 application.appId 唯一约束冲突
-- 版本: 1.0.0
-- 日期: 2025-11-15
-- 说明: 解决 TypeORM 同步时的约束依赖问题
-- ============================================

-- 执行命令: psql -U postgres -d postgres -f sql/migrations/007_fix_application_unique_constraint.sql

-- ============================================
-- 问题描述
-- ============================================
-- TypeORM 尝试删除约束 UQ_bad7d3374806099608903c43d2c 时失败
-- 因为 dashboard 表的外键依赖这个约束
-- 
-- 错误信息:
-- cannot drop constraint UQ_bad7d3374806099608903c43d2c on table application 
-- because other objects depend on it

-- ============================================
-- 解决方案
-- ============================================
-- 1. 先删除依赖该约束的外键
-- 2. 删除旧的唯一约束
-- 3. 重新创建命名的唯一约束
-- 4. 重新创建外键

-- ============================================
-- 1. 删除 dashboard 表的外键约束
-- ============================================
ALTER TABLE dashboard
DROP CONSTRAINT IF EXISTS fk_dashboard_application;

-- ============================================
-- 2. 删除 application 表的旧唯一约束
-- ============================================
-- 删除所有可能存在的唯一约束
ALTER TABLE application
DROP CONSTRAINT IF EXISTS UQ_bad7d3374806099608903c43d2c;

ALTER TABLE application
DROP CONSTRAINT IF EXISTS uq_application_app_id;

-- ============================================
-- 3. 重新创建命名的唯一约束
-- ============================================
-- 使用明确的约束名称,避免 TypeORM 自动生成的名称
ALTER TABLE application
ADD CONSTRAINT uq_application_app_id UNIQUE ("appId");

-- ============================================
-- 4. 重新创建外键约束
-- ============================================
ALTER TABLE dashboard
ADD CONSTRAINT fk_dashboard_application
FOREIGN KEY ("appId") REFERENCES application("appId") ON DELETE CASCADE;

-- ============================================
-- 5. 验证约束
-- ============================================
-- 查看 application 表的约束
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'application'::regclass;

-- 查看 dashboard 表的约束
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'dashboard'::regclass;

