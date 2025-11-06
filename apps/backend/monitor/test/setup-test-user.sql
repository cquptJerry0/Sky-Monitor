-- 创建测试用户（用于 e2e 测试）
-- 注意：这个脚本是幂等的，可以重复执行

-- 检查并创建测试用户
INSERT INTO admin_users (username, password, email, created_at, updated_at)
SELECT 'test-user', '$2a$10$test-hash-placeholder', 'test@skymonitor.com', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM admin_users WHERE username = 'test-user'
);

-- 注意：实际的密码 hash 需要通过 bcrypt 生成
-- 密码: Test@123456
-- Hash: $2a$10$YourActualBcryptHashHere

-- 验证用户是否创建成功
SELECT id, username, email FROM admin_users WHERE username = 'test-user';

