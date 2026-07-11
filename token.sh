#!/usr/bin/env bash
set -euo pipefail
TOKEN=$(curl -s http://127.0.0.1:8081/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"test_user","password":"testpass1"}' | jq -er '.token')
echo "$TOKEN"
