#!/bin/bash

# =============================================================================
# Billing backfill — create free subscriptions for HR/admin users who were
# registered BEFORE billing-service subscribed to user.created events (or
# whenever the user.created event was lost).
#
# In production this never runs: UserCreatedConsumer creates free
# subscriptions idempotently. Dev scripts (create-hr.sh, etc.) predate
# billing-service's Kafka consumer, so HR users created by those scripts
# end up without subscriptions and hit 404 on /api/billing/subscription.
#
# Usage:
#   ./scripts/setup/backfill-billing.sh
# =============================================================================

source "$(dirname "${BASH_SOURCE[0]}")/../common.sh"

echo -e "${BLUE}=== Billing backfill: free subscription per HR/admin user ===${NC}"
echo ""

# Gather billable users (role=hr or admin) from user DB.
USERS_SQL="SELECT id::text FROM users WHERE role IN ('hr','admin') AND deleted_at IS NULL ORDER BY created_at;"
USER_IDS=$(docker exec "$POSTGRES_CONTAINER" \
  psql -U postgres -d ai_video_interview_user -t -A -c "$USERS_SQL" 2>/dev/null)

if [ -z "$USER_IDS" ]; then
  echo -e "${YELLOW}No HR/admin users found. Did you run create-test-users.sh?${NC}"
  exit 0
fi

USER_COUNT=$(echo "$USER_IDS" | wc -l | tr -d ' ')
echo "Found $USER_COUNT billable user(s)"
echo ""

CREATED=0
SKIPPED=0

while IFS= read -r uid; do
  [ -z "$uid" ] && continue

  # ON CONFLICT makes this idempotent — running multiple times is safe.
  # Note: psql always appends an "INSERT 0 N" command tag to stdout even
  # with -t -A, so we parse that tag directly to distinguish insert from
  # skip instead of checking whether the output is non-empty.
  RESULT=$(docker exec "$POSTGRES_CONTAINER" psql -U postgres -d ai_video_interview_billing \
    -t -A -c "INSERT INTO subscriptions (company_id, plan_type, status)
              VALUES ('$uid', 'free', 'active')
              ON CONFLICT (company_id) DO NOTHING
              RETURNING id;" 2>/dev/null)

  if echo "$RESULT" | grep -q "^INSERT 0 1"; then
    echo -e "  ${GREEN}+${NC} created free subscription for $uid"
    CREATED=$((CREATED + 1))
  else
    echo -e "  ${YELLOW}·${NC} skipped $uid (already has subscription)"
    SKIPPED=$((SKIPPED + 1))
  fi
done <<< "$USER_IDS"

echo ""
echo -e "${BLUE}Summary:${NC} $CREATED created, $SKIPPED already existed"
