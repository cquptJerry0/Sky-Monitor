#!/bin/bash

echo "=== 测试 Dashboard API ==="
echo ""

# 0. 先注册用户
echo "0. 注册用户..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8081/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123","email":"test@example.com"}')

echo "注册响应: $REGISTER_RESPONSE"
echo ""

# 1. 登录获取 token
echo "1. 登录..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}')

echo "登录响应: $LOGIN_RESPONSE"
echo ""

# 提取 token (注意字段名是 access_token 不是 accessToken)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "登录失败,无法获取 token"
  exit 1
fi

echo "Token: $TOKEN"
echo ""

# 2. 创建 Dashboard
echo "2. 创建 Dashboard..."
CREATE_DASHBOARD=$(curl -s -X POST http://localhost:8081/api/dashboards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"测试 Dashboard","description":"这是一个测试 Dashboard"}')

echo "创建 Dashboard 响应: $CREATE_DASHBOARD"
echo ""

# 提取 Dashboard ID
DASHBOARD_ID=$(echo $CREATE_DASHBOARD | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Dashboard ID: $DASHBOARD_ID"
echo ""

# 3. 获取 Dashboard 列表
echo "3. 获取 Dashboard 列表..."
LIST_DASHBOARDS=$(curl -s -X GET http://localhost:8081/api/dashboards \
  -H "Authorization: Bearer $TOKEN")

echo "Dashboard 列表: $LIST_DASHBOARDS"
echo ""

# 4. 获取 Dashboard 详情
echo "4. 获取 Dashboard 详情..."
GET_DASHBOARD=$(curl -s -X GET "http://localhost:8081/api/dashboards/$DASHBOARD_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Dashboard 详情: $GET_DASHBOARD"
echo ""

# 5. 创建 Widget
echo "5. 创建 Widget..."
CREATE_WIDGET=$(curl -s -X POST http://localhost:8081/api/dashboards/widgets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"dashboardId\": \"$DASHBOARD_ID\",
    \"title\": \"错误趋势\",
    \"widgetType\": \"line\",
    \"queries\": [{
      \"id\": \"query1\",
      \"fields\": [\"count()\"],
      \"conditions\": [{
        \"field\": \"event_type\",
        \"operator\": \"=\",
        \"value\": \"error\"
      }],
      \"groupBy\": [\"toStartOfHour(timestamp)\"],
      \"orderBy\": [{
        \"field\": \"timestamp\",
        \"direction\": \"ASC\"
      }],
      \"legend\": \"错误数量\"
    }],
    \"layout\": {
      \"x\": 0,
      \"y\": 0,
      \"w\": 6,
      \"h\": 4
    }
  }")

echo "创建 Widget 响应: $CREATE_WIDGET"
echo ""

# 6. 再次获取 Dashboard 详情 (应该包含 Widget)
echo "6. 再次获取 Dashboard 详情 (应该包含 Widget)..."
GET_DASHBOARD_WITH_WIDGET=$(curl -s -X GET "http://localhost:8081/api/dashboards/$DASHBOARD_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Dashboard 详情 (含 Widget): $GET_DASHBOARD_WITH_WIDGET"
echo ""

echo "=== 测试完成 ==="

