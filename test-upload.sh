#!/bin/bash

# Test Resume Upload Endpoint
# This script tests the resume upload functionality

API_URL="http://localhost:3000/api/resume"

echo "🧪 Testing Resume Upload API"
echo "================================"

# Create a test PDF file
echo "Creating test PDF file..."
echo "%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Resume) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF" > test-resume.pdf

echo ""
echo "Test 1: Upload PDF without authentication (anonymous)"
echo "------------------------------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL/upload" \
  -F "resume=@test-resume.pdf")

echo "Response: $RESPONSE"
echo ""

# Check if we have a JWT token from previous auth test
if [ -f ".test-token" ]; then
  TOKEN=$(cat .test-token)
  echo "Test 2: Upload PDF with authentication"
  echo "---------------------------------------"
  RESPONSE=$(curl -s -X POST "$API_URL/upload" \
    -H "Authorization: Bearer $TOKEN" \
    -F "resume=@test-resume.pdf")
  
  echo "Response: $RESPONSE"
  echo ""
fi

echo "Test 3: Upload without file (should fail)"
echo "------------------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL/upload")
echo "Response: $RESPONSE"
echo ""

echo "Test 4: Upload invalid file type (should fail)"
echo "-----------------------------------------------"
echo "This is a text file" > test-file.txt
RESPONSE=$(curl -s -X POST "$API_URL/upload" \
  -F "resume=@test-file.txt")
echo "Response: $RESPONSE"
echo ""

# Cleanup
echo "Cleaning up test files..."
rm -f test-resume.pdf test-file.txt

echo ""
echo "✅ Upload API tests completed!"
echo ""
echo "Note: For full functionality, ensure:"
echo "  1. MongoDB is running"
echo "  2. AWS credentials are configured in .env"
echo "  3. S3 bucket exists and is accessible"
