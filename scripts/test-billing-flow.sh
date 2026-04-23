#!/bin/bash

# =============================================================================
# Stripe Billing Flow — integration smoke test
#
# ONE-TIME SETUP (do once on a fresh machine)
#   brew install stripe/stripe-cli/stripe
#   stripe login
#   ./scripts/setup/create-test-users.sh   # creates HR users, etc.
#   ./scripts/setup/backfill-billing.sh    # seed free subscriptions for HRs
#
# RUNTIME DEPENDENCIES (must be up for this script to pass)
#   - docker compose up -d  (postgres, redis, kafka, keycloak)
#   - npm run dev:api + dev:user + dev:billing  (or dev:all)
#   - In a separate terminal, webhook forwarder:
#       stripe listen --forward-to localhost:8007/api/billing/webhooks/stripe
#   - apps/billing-service/.env must contain:
#       STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
#       STRIPE_PRICE_PLUS, STRIPE_PRICE_PRO
#
# USAGE
#   ./scripts/test-billing-flow.sh <hr_email> <hr_password> [plan]
#   plan = plus | pro (default: plus)
#
#   Default creds from create-test-users.sh: hr@test.com / 123456
#
# WHAT THIS SCRIPT DOES
#   1. Gets JWT via Keycloak direct-grant (password flow).
#      Works because the ai-video-interview-app Keycloak client has
#      "Direct Access Grants Enabled" for dev.
#   2. GET /api/billing/subscription → prints current plan.
#   3. POST /api/billing/checkout { planType } → prints Stripe URL.
#      You open the URL in a browser and pay with a Stripe test card.
#   4. After paying, re-run to see the plan upgrade.
#
# TEST CARDS (Stripe sandbox)
#   4242 4242 4242 4242 — always succeeds
#   4000 0000 0000 0002 — declined at checkout
#   4000 0000 0000 9995 — first payment ok, recurring fails (tests past_due)
#   4000 0025 0000 3155 — 3DS authentication required
# =============================================================================

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

HR_EMAIL="${1:-hr@test.com}"
HR_PASSWORD="${2:-123456}"
PLAN="${3:-plus}"

echo -e "${BLUE}=== Stripe Billing Flow Test ===${NC}"
echo "HR user: $HR_EMAIL"
echo "Plan:    $PLAN"
echo ""

# --- 1. Get JWT via Keycloak password grant --------------------------------
echo -e "${BLUE}[1/4] Getting JWT for $HR_EMAIL via Keycloak ...${NC}"
TOKEN=$(get_user_token "$HR_EMAIL" "$HR_PASSWORD") || {
  echo -e "${RED}✗ Failed to get token (see error above)${NC}"
  echo ""
  echo "Hints:"
  echo "  - is Keycloak up at ${KEYCLOAK_URL}?"
  echo "  - is the user registered in realm ${KEYCLOAK_REALM}?"
  echo "  - does the client ${KEYCLOAK_CLIENT_ID} have 'Direct Access Grants' enabled?"
  exit 1
}

echo -e "${GREEN}✓ Got JWT (len ${#TOKEN})${NC}"

# --- 2. Current subscription ----------------------------------------------
echo ""
echo -e "${BLUE}[2/4] GET /api/billing/subscription ...${NC}"
SUB=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_GATEWAY/api/billing/subscription")
echo "$SUB" | jq . 2>/dev/null || echo "$SUB"

# --- 3. Create checkout session -------------------------------------------
echo ""
echo -e "${BLUE}[3/4] POST /api/billing/checkout {planType:\"$PLAN\"} ...${NC}"
CHECKOUT=$(curl -s -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -X POST "$API_GATEWAY/api/billing/checkout" \
  -d "{\"planType\":\"$PLAN\"}")

CHECKOUT_URL=$(echo "$CHECKOUT" | jq -r '.checkoutUrl // empty')

if [ -z "$CHECKOUT_URL" ]; then
  echo -e "${RED}✗ Checkout failed:${NC}"
  echo "$CHECKOUT" | jq . 2>/dev/null || echo "$CHECKOUT"
  exit 1
fi

echo -e "${GREEN}✓ Checkout session created${NC}"
echo ""
echo -e "${YELLOW}>>> Open this URL in your browser:${NC}"
echo "$CHECKOUT_URL"
echo ""
echo -e "${YELLOW}>>> Use Stripe test card:${NC}"
echo "  Number: 4242 4242 4242 4242"
echo "  Expiry: any future date (e.g. 12/34)"
echo "  CVC:    any 3 digits"
echo "  ZIP:    any 5 digits"
echo ""

# --- 4. Post-payment verification hints -----------------------------------
echo -e "${BLUE}[4/4] After paying, verify:${NC}"
echo "  a) Webhook fired — watch 'stripe listen' terminal for 200 response"
echo "  b) Re-run this script — subscription should switch to $PLAN/active"
echo "  c) Or query DB directly:"
echo "     docker exec -it ${POSTGRES_CONTAINER} psql -U postgres -d ai_video_interview_billing \\"
echo "       -c \"SELECT plan_type, status, cancel_at_period_end FROM subscriptions;\""
