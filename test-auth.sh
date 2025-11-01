#!/bin/bash

echo "🧪 Testing Authentication API"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000/api"

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
HEALTH=$(curl -s ${API_URL}/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi
echo ""

# Test 2: Register User
echo "2️⃣  Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST ${API_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234",
    "firstName": "Test",
    "lastName": "User"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Registration successful${NC}"
    ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo "   Token: ${ACCESS_TOKEN:0:20}..."
else
    echo -e "${RED}❌ Registration failed${NC}"
    echo "   Response: $REGISTER_RESPONSE"
fi
echo ""

# Test 3: Login
echo "3️⃣  Testing User Login..."
LOGIN_RESPONSE=$(curl -s -X POST ${API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Login successful${NC}"
    LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo "   Token: ${LOGIN_TOKEN:0:20}..."
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Test 4: Get Profile (Protected Route)
echo "4️⃣  Testing Protected Route (Get Profile)..."
PROFILE_RESPONSE=$(curl -s ${API_URL}/auth/me \
  -H "Authorization: Bearer ${LOGIN_TOKEN}")

if echo "$PROFILE_RESPONSE" | grep -q "test@example.com"; then
    echo -e "${GREEN}✅ Profile retrieval successful${NC}"
    echo "   Email: test@example.com"
else
    echo -e "${RED}❌ Profile retrieval failed${NC}"
    echo "   Response: $PROFILE_RESPONSE"
fi
echo ""

# Test 5: Invalid Login
echo "5️⃣  Testing Invalid Login..."
INVALID_LOGIN=$(curl -s -X POST ${API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword"
  }')

if echo "$INVALID_LOGIN" | grep -q "Invalid email or password"; then
    echo -e "${GREEN}✅ Invalid login correctly rejected${NC}"
else
    echo -e "${RED}❌ Invalid login test failed${NC}"
fi
echo ""

echo "=============================="
echo "✅ All authentication tests completed!"
