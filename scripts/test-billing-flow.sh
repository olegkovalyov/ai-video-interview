#!/bin/bash

# =============================================================================
# Stripe Billing Flow — integration smoke test
# Prerequisites:
#   - docker compose up -d (all services running)
#   - npm run dev:all  (or at least api-gateway + billing-service)
#   - stripe CLI installed + `stripe listen --forward-to localhost:8007/api/billing/webhooks/stripe`
#     running in another terminal (so webhooks come back to our backend)
#   - STRIPE_PRICE_PLUS, STRIPE_PRICE_PRO in apps/billing-service/.env
#
# Usage:
#   ./scripts/test-billing-flow.sh <hr_email> <hr_password>
#
# What this does:
#   1. Logs in as HR to get JWT
#   2. Checks current subscription (expects "free")
#   3. Creates a Stripe checkout session → prints URL to open in browser
#   4. Tells you what to do next
# =============================================================================

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

HR_EMAIL="${1:-hr@test.com}"
HR_PASSWORD="${2:-Test123!}"

echo -e "${BLUE}=== Stripe Billing Flow Test ===${NC}"
echo "HR user: $HR_EMAIL"
echo ""

# --- 1. Login --------------------------------------------------------------
echo -e "${BLUE}[1/4] Logging in as $HR_EMAIL ...${NC}"
LOGIN_RESP=$(curl -s -c /tmp/billing-test-cookies.txt -X POST "$API_GATEWAY/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$HR_EMAIL\",\"password\":\"$HR_PASSWORD\"}")

if echo "$LOGIN_RESP" | grep -q '"success":true\|access_token'; then
  echo -e "${GREEN}✓ Login OK${NC}"
else
  echo -e "${RED}✗ Login failed:${NC}"
  echo "$LOGIN_RESP" | head -c 400
  exit 1
fi

# --- 2. Current subscription ----------------------------------------------
echo ""
echo -e "${BLUE}[2/4] Checking current subscription ...${NC}"
SUB=$(curl -s -b /tmp/billing-test-cookies.txt "$API_GATEWAY/api/billing/subscription")
echo "$SUB" | python3 -m json.tool 2>/dev/null || echo "$SUB"

# --- 3. Create checkout session -------------------------------------------
echo ""
echo -e "${BLUE}[3/4] Creating checkout session for 'plus' plan ...${NC}"
CHECKOUT=$(curl -s -b /tmp/billing-test-cookies.txt -X POST "$API_GATEWAY/api/billing/checkout" \
  -H 'Content-Type: application/json' \
  -d '{"planType":"plus"}')

CHECKOUT_URL=$(echo "$CHECKOUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('checkoutUrl',''))" 2>/dev/null)

if [ -z "$CHECKOUT_URL" ]; then
  echo -e "${RED}✗ Checkout session creation failed:${NC}"
  echo "$CHECKOUT"
  exit 1
fi

echo -e "${GREEN}✓ Checkout session created${NC}"
echo ""
echo -e "${YELLOW}>>> Open this URL in your browser:${NC}"
echo "$CHECKOUT_URL"
echo ""
echo -e "${YELLOW}>>> Use Stripe test card:${NC}"
echo "  Number: 4242 4242 4242 4242"
echo "  Expiry: any future date"
echo "  CVC:    any 3 digits"
echo "  ZIP:    any 5 digits"
echo ""

# --- 4. Post-payment verification -----------------------------------------
echo -e "${BLUE}[4/4] After paying in Stripe, verify:${NC}"
echo "  a) Webhook fired: check \`stripe listen\` terminal for 'checkout.session.completed'"
echo "  b) DB state:"
echo "     psql -U postgres -d ai_video_interview_billing -c \"SELECT plan_type, status FROM subscriptions;\""
echo "  c) UI state:"
echo "     Open http://localhost:3000/profile/billing — plan should show 'Plus'"
echo "  d) Run this script again — subscription should show plus/active"
echo ""
rm -f /tmp/billing-test-cookies.txt
