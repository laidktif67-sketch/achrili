#!/usr/bin/env bash
set -euo pipefail

container_id="${1:?Usage: atomic-quote-concurrency.sh POSTGRES_CONTAINER_ID}"
psql=(docker exec "$container_id" psql -U postgres -d achrili_test -v ON_ERROR_STOP=1)

# Both sessions race to create a quote for the same request. The request-row lock
# must allow exactly one RPC to commit and make the other reject the active quote.
"${psql[@]}" -c "INSERT INTO public.\"ProductRequest\" (id, status) VALUES ('concurrent-quote-1', 'SUBMITTED')"

set +e
"${psql[@]}" -c "SELECT * FROM public.create_quote_atomically('concurrent-quote-1', 'DZD', 100, 20, 5, 0, 125, NULL, now() + interval '1 day')" > /tmp/quote-race-a.log 2>&1 &
pid_a=$!
"${psql[@]}" -c "SELECT * FROM public.create_quote_atomically('concurrent-quote-1', 'DZD', 110, 20, 5, 0, 135, NULL, now() + interval '1 day')" > /tmp/quote-race-b.log 2>&1 &
pid_b=$!
wait "$pid_a"
status_a=$?
wait "$pid_b"
status_b=$?
set -e

if [[ "$status_a" -eq 0 && "$status_b" -ne 0 ]]; then
  failure_log=/tmp/quote-race-b.log
elif [[ "$status_b" -eq 0 && "$status_a" -ne 0 ]]; then
  failure_log=/tmp/quote-race-a.log
else
  echo "Expected exactly one successful quote creation; got statuses $status_a and $status_b."
  cat /tmp/quote-race-a.log /tmp/quote-race-b.log
  exit 1
fi

if ! grep -q "active_quote_exists" "$failure_log"; then
  echo "The losing request did not fail because an active quote exists."
  cat "$failure_log"
  exit 1
fi

quote_count=$("${psql[@]}" -At -c "SELECT count(*) FROM public.\"Quote\" WHERE \"requestId\" = 'concurrent-quote-1'")
if [[ "$quote_count" != "1" ]]; then
  echo "Expected exactly one committed quote, found $quote_count."
  exit 1
fi

echo "Atomic quote concurrency test passed: one commit, one active_quote_exists rejection."
