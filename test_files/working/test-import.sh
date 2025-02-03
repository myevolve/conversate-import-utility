#!/bin/bash

# Start the server in the background
PORT=53875 npm run dev > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test the import flow
echo "Testing import flow..."

# 1. Create test CSV file
cat > test-import.csv << EOL
name,email,phone_number,labels
Format1,test1a@example.com,+16195551001,test
Format2,test2a@example.com,6195551002,test
Format3,test3a@example.com,16195551003,test
Format4,test4a@example.com,(619) 555-1004,test
Format5,test5a@example.com,619-555-1005,test
EOL

# 2. Login to get auth tokens
echo "Logging in..."
LOGIN_RESPONSE=$(curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"sr@conversate.us","password":"Demo123456!"}' \
  -i \
  http://localhost:53875/api/auth/sign_in)

# Extract auth tokens from headers
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -i '^set-cookie:' | grep 'access-token' | cut -d'=' -f2 | cut -d';' -f1)
CLIENT=$(echo "$LOGIN_RESPONSE" | grep -i '^set-cookie:' | grep 'client' | cut -d'=' -f2 | cut -d';' -f1)
USER_ID=$(echo "$LOGIN_RESPONSE" | grep -i '^set-cookie:' | grep 'uid' | cut -d'=' -f2 | cut -d';' -f1 | python3 -c "import urllib.parse; print(urllib.parse.unquote(input()))")

echo "Got auth tokens:"
echo "Access Token: $ACCESS_TOKEN"
echo "Client: $CLIENT"
echo "User ID: $USER_ID"

# 3. Upload file and start import
echo "Starting import..."
curl -X POST \
  -H "Content-Type: multipart/form-data" \
  -H "access-token: $ACCESS_TOKEN" \
  -H "client: $CLIENT" \
  -H "uid: $USER_ID" \
  -F "file=@test-import.csv" \
  http://localhost:53875/api/import

# Kill the server
kill $SERVER_PID