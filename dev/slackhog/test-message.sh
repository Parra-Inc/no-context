#!/bin/bash

# Test script for Slackhog
# Sends various test messages to verify functionality

BASE_URL="http://localhost:9002"
TOKEN="xoxb-test-token"

echo "🐗 Slackhog Test Script"
echo "======================="
echo ""

# Test 1: Simple message
echo "1. Sending simple message..."
curl -X POST "$BASE_URL/api/chat/postMessage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "C000000001",
    "text": "Hello from Slackhog! 👋",
    "user": "U123456",
    "username": "Test User"
  }' \
  -s | jq .
echo ""

# Test 2: Message with markdown
echo "2. Sending message with markdown..."
curl -X POST "$BASE_URL/api/chat/postMessage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "C000000001",
    "text": "# Markdown Test\n\n- **Bold text**\n- *Italic text*\n- `code snippet`",
    "user": "U123456",
    "username": "Test User"
  }' \
  -s | jq .
echo ""

# Test 3: Message with attachment
echo "3. Sending message with attachment..."
curl -X POST "$BASE_URL/api/chat/postMessage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "C000000001",
    "text": "Check out this image!",
    "user": "U123456",
    "username": "Test User",
    "attachments": [
      {
        "title": "Test Image",
        "text": "This is a test attachment",
        "image_url": "https://via.placeholder.com/400x300.png?text=Slackhog+Test",
        "fallback": "Test attachment"
      }
    ]
  }' \
  -s | jq .
echo ""

# Test 4: Get the message timestamp for reactions
echo "4. Getting last message..."
LAST_MESSAGE=$(curl -s "$BASE_URL/api/messages/C000000001" | jq -r '.messages[-1].ts')
echo "Last message timestamp: $LAST_MESSAGE"
echo ""

# Test 5: Add reaction
if [ "$LAST_MESSAGE" != "null" ]; then
  echo "5. Adding reaction..."
  curl -X POST "$BASE_URL/api/reactions/add" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"channel\": \"C000000001\",
      \"timestamp\": \"$LAST_MESSAGE\",
      \"name\": \"👍\",
      \"user\": \"U123456\"
    }" \
    -s | jq .
  echo ""
fi

echo "✅ Test complete! Check http://localhost:9002 to see the messages."
