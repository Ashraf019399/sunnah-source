/**
 * ==============================================================================
 * Sunnah Source: Two-Connection PostgreSQL Concurrency Verification Suite
 * File: tests/verify_pg_concurrency.mjs
 *
 * PURPOSE:
 *   Validates physical PostgreSQL row-level locks, wait queues, and serialization
 *   between two concurrent client connections (`client1` and `client2`).
 *
 * SAFETY INVARIANTS:
 *   1. Environment & Credential Safety:
 *      - Reads process.env.STAGING_DATABASE_URL and process.env.EXPECTED_PROJECT_REF.
 *      - Strictly requires EXPECTED_PROJECT_REF === 'petuvhmqdarykxlagivv'.
 *      - Aborts immediately before any socket connection if 'fgfucwholpkizwlvlfrp'
 *        (production ref) is detected in STAGING_DATABASE_URL or EXPECTED_PROJECT_REF.
 *      - Credentials/passwords are NEVER printed in logs or errors.
 *   2. Pre-Flight Read-Only Invariants:
 *      - Verifies the 3 required RPCs exist in public schema.
 *      - Verifies other_orders count is 0 (prevents running on polluted database).
 *      - Verifies starting fixture stock (20), coupon usage (2), and order statuses.
 *   3. Lock Blocking Observation:
 *      - Uses pg_stat_activity and pg_locks to verify that client2 is genuinely
 *        blocked on an ungranted lock before client1 commits.
 *   4. Cleanup Safety:
 *      - Never cleans up automatically; cleanup requires explicit
 *        `--cleanup --confirm-cleanup=YES` flags.
 * ==============================================================================
 */

import pg from "pg";

const { Client } = pg;

// Safety & Target Project References
export const EXPECTED_PROJECT_REF = "petuvhmqdarykxlagivv";
export const PRODUCTION_PROJECT_REF = "fgfucwholpkizwlvlfrp";

// Dedicated Concurrency Fixture Identifiers (prefix 6666)
export const FIXTURES = {
  productId: "99999999-6666-6666-6666-666666666666",
  variantId: "88888888-6666-6666-6666-666666666661",
  couponCode: "TESTCONCUR100",
  order1Id: "11111111-6666-6666-6666-666666666661",
  order2Id: "11111111-6666-6666-6666-666666666662",
  order3Id: "11111111-6666-6666-6666-666666666663",
  order4Id: "11111111-6666-6666-6666-666666666664",
};

/**
 * Validates environment variables and strictly protects against production targeting.
 * Does not open network sockets.
 */
export function validateEnvironmentGuards(env = process.env) {
  const dbUrl = env.STAGING_DATABASE_URL;
  const projectRef = env.EXPECTED_PROJECT_REF;

  if (!dbUrl || !dbUrl.trim()) {
    return {
      ok: false,
      reason: "MISSING_STAGING_DATABASE_URL",
      message: "STAGING_DATABASE_URL environment variable is missing or empty.",
    };
  }

  if (!projectRef || !projectRef.trim()) {
    return {
      ok: false,
      reason: "MISSING_EXPECTED_PROJECT_REF",
      message: "EXPECTED_PROJECT_REF environment variable is missing or empty.",
    };
  }

  // Strict Production Rejection: abort before any socket connection
  if (
    dbUrl.includes(PRODUCTION_PROJECT_REF) ||
    projectRef.includes(PRODUCTION_PROJECT_REF)
  ) {
    return {
      ok: false,
      reason: "PRODUCTION_TARGET_DETECTED",
      message: `CRITICAL SAFETY ABORT: Detected production project reference (${PRODUCTION_PROJECT_REF}). Operations on production are strictly forbidden.`,
    };
  }

  if (projectRef !== EXPECTED_PROJECT_REF) {
    return {
      ok: false,
      reason: "PROJECT_REF_MISMATCH",
      message: `EXPECTED_PROJECT_REF mismatch. Expected: ${EXPECTED_PROJECT_REF}, Received: ${projectRef}`,
    };
  }

  if (!dbUrl.includes(EXPECTED_PROJECT_REF)) {
    return {
      ok: false,
      reason: "URL_REF_MISMATCH",
      message: `STAGING_DATABASE_URL host does not match expected staging reference (${EXPECTED_PROJECT_REF}).`,
    };
  }

  return { ok: true };
}

/**
 * Helper to sanitize database URL for display (redacts credentials and host details).
 */
export function sanitizeUrlSummary(dbUrl) {
  try {
    const url = new URL(dbUrl);
    return `postgresql://${url.username ? "[REDACTED_USER]" : ""}@${url.hostname ? "[REDACTED_HOST]" : ""}:${url.port || 5432}${url.pathname}`;
  } catch {
    return "postgresql://[REDACTED_CREDENTIALS]";
  }
}

/**
 * Polls pg_stat_activity and pg_locks from the inspecting client to confirm
 * that the target PID has entered a genuine lock wait state with an ungranted lock.
 */
export async function waitForLockContention(
  inspectClient,
  targetPid,
  timeoutMs = 5000,
  intervalMs = 100
) {
  const startTime = Date.now();
  const query = `
    SELECT 
      a.state,
      a.wait_event_type,
      a.wait_event,
      EXISTS (
        SELECT 1 
        FROM pg_locks l 
        WHERE l.pid = $1 AND NOT l.granted
      ) AS has_ungranted_lock
    FROM pg_stat_activity a
    WHERE a.pid = $1;
  `;

  while (Date.now() - startTime < timeoutMs) {
    const res = await inspectClient.query(query, [targetPid]);
    if (res.rows.length > 0) {
      const row = res.rows[0];
      const hasUngranted =
        row.has_ungranted_lock === true || row.has_ungranted_lock === "t";
      if (row.wait_event_type === "Lock" && hasUngranted) {
        return {
          detected: true,
          elapsedMs: Date.now() - startTime,
          state: row.state,
          waitEventType: row.wait_event_type,
          waitEvent: row.wait_event,
        };
      }
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for PID ${targetPid} to enter a physical lock wait state (wait_event_type: 'Lock', has_ungranted_lock: true).`
  );
}

/**
 * Pre-flight read-only checks: verifies RPC presence, zero other orders, and exact fixture state.
 */
export async function runPreflightChecks(client) {
  console.log("🔍 Running Pre-Flight Read-Only Database Validations...");

  // 1. Verify required RPC functions in public schema
  const rpcQuery = `
    SELECT p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'create_order_with_inventory',
        'update_order_status_with_inventory',
        'update_order_payment_status'
      );
  `;
  const rpcRes = await client.query(rpcQuery);
  const foundRpcs = new Set(rpcRes.rows.map((r) => r.proname));
  for (const requiredRpc of [
    "create_order_with_inventory",
    "update_order_status_with_inventory",
    "update_order_payment_status",
  ]) {
    if (!foundRpcs.has(requiredRpc)) {
      throw new Error(
        `PRE-FLIGHT ABORT: Required RPC function 'public.${requiredRpc}' is missing from target database.`
      );
    }
  }
  console.log("  ✓ All 3 required lifecycle RPC functions verified in public schema.");

  // 2. Verify other_orders count is 0
  const otherOrdersQuery = `
    SELECT COUNT(*)::INT AS count
    FROM public.orders
    WHERE id NOT IN ($1, $2, $3, $4);
  `;
  const otherOrdersRes = await client.query(otherOrdersQuery, [
    FIXTURES.order1Id,
    FIXTURES.order2Id,
    FIXTURES.order3Id,
    FIXTURES.order4Id,
  ]);
  const otherOrdersCount = otherOrdersRes.rows[0].count;
  if (otherOrdersCount > 0) {
    throw new Error(
      `PRE-FLIGHT ABORT: Target database contains ${otherOrdersCount} unrecognised orders. Concurrency verification requires an isolated staging database.`
    );
  }
  console.log("  ✓ Database order isolation verified (0 non-concurrency orders found).");

  // 3. Verify Product Variant fixture
  const varRes = await client.query(
    "SELECT id, sku, stock_quantity FROM public.product_variants WHERE id = $1;",
    [FIXTURES.variantId]
  );
  if (varRes.rows.length === 0) {
    throw new Error(
      `PRE-FLIGHT ABORT: Concurrency variant ${FIXTURES.variantId} not found. Run seed script first.`
    );
  }
  const initialStock = varRes.rows[0].stock_quantity;
  if (initialStock !== 20) {
    throw new Error(
      `PRE-FLIGHT ABORT: Concurrency variant starting stock is ${initialStock}, expected exactly 20.`
    );
  }
  console.log("  ✓ Variant fixture verified: stock_quantity === 20.");

  // 4. Verify Coupon fixture
  const cpnRes = await client.query(
    "SELECT code, times_used, usage_limit, is_active FROM public.coupons WHERE UPPER(code) = UPPER($1);",
    [FIXTURES.couponCode]
  );
  if (cpnRes.rows.length === 0) {
    throw new Error(
      `PRE-FLIGHT ABORT: Concurrency coupon ${FIXTURES.couponCode} not found. Run seed script first.`
    );
  }
  const coupon = cpnRes.rows[0];
  if (coupon.times_used !== 2 || coupon.usage_limit !== 5 || !coupon.is_active) {
    throw new Error(
      `PRE-FLIGHT ABORT: Coupon state mismatch. Expected times_used: 2, limit: 5, active: true. Observed: times_used=${coupon.times_used}, limit=${coupon.usage_limit}, active=${coupon.is_active}`
    );
  }
  console.log("  ✓ Coupon fixture verified: times_used === 2, usage_limit === 5, is_active === true.");

  // 5. Verify Orders 1, 2, 3 fixtures
  const ordersRes = await client.query(
    "SELECT id, order_number, order_status::TEXT, payment_status::TEXT, coupon_code FROM public.orders WHERE id IN ($1, $2, $3);",
    [FIXTURES.order1Id, FIXTURES.order2Id, FIXTURES.order3Id]
  );
  const ordersMap = new Map(ordersRes.rows.map((o) => [o.id, o]));

  const o1 = ordersMap.get(FIXTURES.order1Id);
  if (!o1 || o1.order_status !== "pending" || o1.payment_status !== "unpaid" || o1.coupon_code !== FIXTURES.couponCode) {
    throw new Error(`PRE-FLIGHT ABORT: Order 1 state mismatch. Observed: ${JSON.stringify(o1)}`);
  }

  const o2 = ordersMap.get(FIXTURES.order2Id);
  if (!o2 || o2.order_status !== "pending" || o2.payment_status !== "unpaid" || o2.coupon_code !== null) {
    throw new Error(`PRE-FLIGHT ABORT: Order 2 state mismatch. Observed: ${JSON.stringify(o2)}`);
  }

  const o3 = ordersMap.get(FIXTURES.order3Id);
  if (!o3 || o3.order_status !== "confirmed" || o3.payment_status !== "unpaid" || o3.coupon_code !== FIXTURES.couponCode) {
    throw new Error(`PRE-FLIGHT ABORT: Order 3 state mismatch. Observed: ${JSON.stringify(o3)}`);
  }
  console.log("  ✓ Orders 1, 2, 3 starting fixtures verified.");

  // 6. Verify Order 4 does NOT exist yet
  const o4Res = await client.query("SELECT 1 FROM public.orders WHERE id = $1;", [FIXTURES.order4Id]);
  if (o4Res.rows.length > 0) {
    throw new Error("PRE-FLIGHT ABORT: Order 4 already exists before testing. Staging DB requires clean fixtures.");
  }
  console.log("  ✓ Order 4 confirmed absent prior to concurrency execution.");
  console.log("✓ Pre-Flight validations passed cleanly.\n");
}

/**
 * Scenario A: Duplicate Order Cancellation Concurrency.
 * Client 1 begins cancelling Order 1.
 * Client 2 simultaneously attempts cancelling Order 1 and blocks.
 * Client 1 commits (restoring stock and coupon once).
 * Client 2 unblocks as a no-op (stock and coupon not restored twice).
 */
export async function runScenarioA(client1, client2, pid2) {
  console.log("▶ Running Scenario A: Concurrent Duplicate Cancellation (Order 1)...");

  await client1.query("BEGIN;");
  const res1 = await client1.query(
    "SELECT public.update_order_status_with_inventory($1::UUID, 'cancelled') AS result;",
    [FIXTURES.order1Id]
  );
  const r1 = res1.rows[0].result;
  if (!r1.success || !r1.stock_restored || !r1.coupon_restored) {
    throw new Error(`Scenario A Client 1 unexpected response: ${JSON.stringify(r1)}`);
  }

  await client2.query("BEGIN;");
  const p2 = client2.query(
    "SELECT public.update_order_status_with_inventory($1::UUID, 'cancelled') AS result;",
    [FIXTURES.order1Id]
  );

  const lockContention = await waitForLockContention(client1, pid2);
  console.log(`  ✓ Confirmed Client 2 blocked on lock (${lockContention.waitEvent}) after ${lockContention.elapsedMs}ms.`);

  await client1.query("COMMIT;");
  console.log("  ✓ Client 1 committed. Awaiting Client 2 unblock...");

  const res2 = await p2;
  const r2 = res2.rows[0].result;
  await client2.query("COMMIT;");

  if (!r2.success || !r2.is_noop || r2.stock_restored || r2.coupon_restored) {
    throw new Error(`Scenario A Client 2 unexpected response: ${JSON.stringify(r2)}`);
  }
  console.log("  ✓ Client 2 unblocked as idempotent no-op (stock_restored: false, coupon_restored: false).");

  // Invariant verification for Scenario A
  const stockRes = await client1.query(
    "SELECT stock_quantity FROM public.product_variants WHERE id = $1;",
    [FIXTURES.variantId]
  );
  const cpnRes = await client1.query(
    "SELECT times_used FROM public.coupons WHERE UPPER(code) = UPPER($1);",
    [FIXTURES.couponCode]
  );

  if (stockRes.rows[0].stock_quantity !== 22) {
    throw new Error(`Scenario A Stock Invariant Failed: Expected 22, got ${stockRes.rows[0].stock_quantity}`);
  }
  if (cpnRes.rows[0].times_used !== 1) {
    throw new Error(`Scenario A Coupon Invariant Failed: Expected times_used = 1, got ${cpnRes.rows[0].times_used}`);
  }
  console.log("  ✓ Scenario A Invariants Verified: Stock === 22, Coupon times_used === 1.\n");
}

/**
 * Scenario B: Order Cancellation vs Concurrent Payment Status Update.
 * Client 1 begins cancelling Order 2.
 * Client 2 simultaneously attempts marking Order 2 as 'paid' and blocks.
 * Client 1 commits.
 * Client 2 unblocks, re-reads status, and rejects payment update.
 */
export async function runScenarioB(client1, client2, pid2) {
  console.log("▶ Running Scenario B: Cancellation vs Concurrent Payment Status Update (Order 2)...");

  await client1.query("BEGIN;");
  const res1 = await client1.query(
    "SELECT public.update_order_status_with_inventory($1::UUID, 'cancelled') AS result;",
    [FIXTURES.order2Id]
  );
  const r1 = res1.rows[0].result;
  if (!r1.success || !r1.stock_restored) {
    throw new Error(`Scenario B Client 1 unexpected response: ${JSON.stringify(r1)}`);
  }

  await client2.query("BEGIN;");
  const p2 = client2.query(
    "SELECT public.update_order_payment_status($1::UUID, 'paid') AS result;",
    [FIXTURES.order2Id]
  );

  const lockContention = await waitForLockContention(client1, pid2);
  console.log(`  ✓ Confirmed Client 2 blocked on lock (${lockContention.waitEvent}) after ${lockContention.elapsedMs}ms.`);

  await client1.query("COMMIT;");
  console.log("  ✓ Client 1 committed. Awaiting Client 2 unblock...");

  const res2 = await p2;
  const r2 = res2.rows[0].result;
  await client2.query("COMMIT;");

  if (r2.success !== false || !r2.message.includes("বাতিলকৃত বা ফেরতকৃত")) {
    throw new Error(`Scenario B Client 2 should reject payment update on cancelled order. Got: ${JSON.stringify(r2)}`);
  }
  console.log("  ✓ Client 2 unblocked and was rejected under row lock ('বাতিলকৃত বা ফেরতকৃত').");

  // Invariant verification for Scenario B
  const stockRes = await client1.query(
    "SELECT stock_quantity FROM public.product_variants WHERE id = $1;",
    [FIXTURES.variantId]
  );
  const o2Res = await client1.query(
    "SELECT order_status::TEXT, payment_status::TEXT FROM public.orders WHERE id = $1;",
    [FIXTURES.order2Id]
  );

  if (stockRes.rows[0].stock_quantity !== 23) {
    throw new Error(`Scenario B Stock Invariant Failed: Expected 23, got ${stockRes.rows[0].stock_quantity}`);
  }
  if (o2Res.rows[0].order_status !== "cancelled" || o2Res.rows[0].payment_status !== "unpaid") {
    throw new Error(`Scenario B Order 2 State Invariant Failed: Expected cancelled/unpaid, got ${JSON.stringify(o2Res.rows[0])}`);
  }
  console.log("  ✓ Scenario B Invariants Verified: Stock === 23, Order 2 === cancelled/unpaid.\n");
}

/**
 * Scenario C: Order Cancellation vs Concurrent Checkout (Shared Coupon & Variant).
 * Client 1 begins cancelling Order 3 (holding Order -> Coupon -> Variant locks).
 * Client 2 simultaneously attempts checkout of Order 4 using same Coupon & Variant.
 * Client 2 blocks on Coupon lock without deadlock (uniform lock hierarchy).
 * Client 1 commits (stock becomes 26, coupon becomes 0).
 * Client 2 unblocks, verifies stock and coupon quota, and succeeds (stock becomes 24, coupon becomes 1).
 */
export async function runScenarioC(client1, client2, pid2) {
  console.log("▶ Running Scenario C: Cancellation vs Concurrent Checkout (Order 3 vs Order 4)...");

  await client1.query("BEGIN;");
  const res1 = await client1.query(
    "SELECT public.update_order_status_with_inventory($1::UUID, 'cancelled') AS result;",
    [FIXTURES.order3Id]
  );
  const r1 = res1.rows[0].result;
  if (!r1.success || !r1.stock_restored || !r1.coupon_restored) {
    throw new Error(`Scenario C Client 1 unexpected response: ${JSON.stringify(r1)}`);
  }

  const itemsJson = JSON.stringify([
    {
      product_id: FIXTURES.productId,
      variant_id: FIXTURES.variantId,
      product_title: "Concurrency Test Product",
      variant_name: "500g",
      unit_price: 500,
      quantity: 2,
      line_total: 1000,
    },
  ]);

  await client2.query("BEGIN;");
  const p2 = client2.query(
    `SELECT public.create_order_with_inventory(
      $1::UUID, $2, $3, $4, $5::JSONB, $6, $7, $8, $9, $10, $11, $12, $13::JSONB, $14
    ) AS result;`,
    [
      FIXTURES.order4Id,
      "SS-CONCUR-004",
      "Customer D",
      "01744444444",
      JSON.stringify({ fullAddress: "Dhaka", district: "Dhaka", zone: "inside_dhaka" }),
      1000,
      70,
      100,
      FIXTURES.couponCode,
      970,
      "cod",
      "unpaid",
      itemsJson,
      "test_concur_idem_key_004",
    ]
  );

  const lockContention = await waitForLockContention(client1, pid2);
  console.log(`  ✓ Confirmed Client 2 blocked on lock (${lockContention.waitEvent}) without deadlock.`);

  await client1.query("COMMIT;");
  console.log("  ✓ Client 1 committed. Awaiting Client 2 unblock...");

  const res2 = await p2;
  const r2 = res2.rows[0].result;
  await client2.query("COMMIT;");

  if (!r2.success || r2.is_duplicate) {
    throw new Error(`Scenario C Client 2 checkout failed: ${JSON.stringify(r2)}`);
  }
  console.log("  ✓ Client 2 checkout unblocked and completed successfully.");

  // Final Invariant Verification across all fixtures
  console.log("🔍 Verifying Final System State...");
  const finalStockRes = await client1.query(
    "SELECT stock_quantity FROM public.product_variants WHERE id = $1;",
    [FIXTURES.variantId]
  );
  const finalCpnRes = await client1.query(
    "SELECT times_used FROM public.coupons WHERE UPPER(code) = UPPER($1);",
    [FIXTURES.couponCode]
  );
  const finalOrdersRes = await client1.query(
    "SELECT id, order_status::TEXT, payment_status::TEXT FROM public.orders WHERE id IN ($1, $2, $3, $4);",
    [FIXTURES.order1Id, FIXTURES.order2Id, FIXTURES.order3Id, FIXTURES.order4Id]
  );
  const finalMap = new Map(finalOrdersRes.rows.map((o) => [o.id, o]));

  const stock = finalStockRes.rows[0].stock_quantity;
  const timesUsed = finalCpnRes.rows[0].times_used;

  if (stock !== 24) {
    throw new Error(`FINAL INVARIANT FAILED: Expected variant stock = 24, got ${stock}`);
  }
  if (timesUsed !== 1) {
    throw new Error(`FINAL INVARIANT FAILED: Expected coupon times_used = 1, got ${timesUsed}`);
  }

  for (const id of [FIXTURES.order1Id, FIXTURES.order2Id, FIXTURES.order3Id]) {
    const o = finalMap.get(id);
    if (!o || o.order_status !== "cancelled" || o.payment_status !== "unpaid") {
      throw new Error(`FINAL INVARIANT FAILED on order ${id}: Expected cancelled/unpaid, got ${JSON.stringify(o)}`);
    }
  }

  const o4 = finalMap.get(FIXTURES.order4Id);
  if (!o4 || o4.order_status !== "pending" || o4.payment_status !== "unpaid") {
    throw new Error(`FINAL INVARIANT FAILED on Order 4: Expected pending/unpaid, got ${JSON.stringify(o4)}`);
  }

  console.log("  ✓ Final Invariant: Variant stock is exactly 24 (20 + 2 + 1 + 3 - 2).");
  console.log("  ✓ Final Invariant: Coupon times_used is exactly 1 (2 - 1 - 1 + 1).");
  console.log("  ✓ Final Invariant: Orders 1, 2, 3 are cancelled and unpaid.");
  console.log("  ✓ Final Invariant: Order 4 is pending and unpaid.");
  console.log("✓ Scenario C & Final Invariants Verified Successfully.\n");
}

/**
 * Cleanup function for removing concurrency fixtures.
 * Requires explicit CLI flags: `--cleanup --confirm-cleanup=YES`.
 */
export async function runCleanup(client) {
  console.log("🧹 Running Explicit Test Fixture Cleanup (Child-First Order)...");
  const ordIds = [
    FIXTURES.order1Id,
    FIXTURES.order2Id,
    FIXTURES.order3Id,
    FIXTURES.order4Id,
  ];

  await client.query("DELETE FROM public.order_items WHERE order_id = ANY($1::UUID[]);", [ordIds]);
  await client.query(
    "DELETE FROM public.orders WHERE id = ANY($1::UUID[]) OR order_number IN ('SS-CONCUR-001', 'SS-CONCUR-002', 'SS-CONCUR-003', 'SS-CONCUR-004');",
    [ordIds]
  );
  await client.query("DELETE FROM public.coupons WHERE UPPER(code) = UPPER($1);", [FIXTURES.couponCode]);
  await client.query("DELETE FROM public.product_variants WHERE id = $1::UUID;", [FIXTURES.variantId]);
  await client.query("DELETE FROM public.products WHERE id = $1::UUID;", [FIXTURES.productId]);

  console.log("✓ Fixtures successfully cleaned up.\n");
}

/**
 * Main Entrypoint
 */
async function main() {
  const isDryRunGuards = process.argv.includes("--dry-run-guards");
  const isCleanup = process.argv.includes("--cleanup");
  const hasCleanupConfirm = process.argv.includes("--confirm-cleanup=YES");

  // 1. Validate Environment & Safety Guards
  const guardResult = validateEnvironmentGuards(process.env);
  if (!guardResult.ok) {
    console.error(`❌ SAFETY GUARD FAILED [${guardResult.reason}]: ${guardResult.message}`);
    process.exit(1);
  }

  if (isDryRunGuards) {
    console.log("✓ All environment and credential safety guards verified successfully.");
    console.log(`  - Target Project Ref: ${EXPECTED_PROJECT_REF}`);
    console.log(`  - Sanitized DB URL: ${sanitizeUrlSummary(process.env.STAGING_DATABASE_URL)}`);
    console.log("  - Dry-Run completed. No database connections opened.");
    process.exit(0);
  }

  // 2. Cleanup Mode
  if (isCleanup) {
    if (!hasCleanupConfirm) {
      console.error("❌ Refusing cleanup without explicit confirmation flag: --confirm-cleanup=YES");
      process.exit(1);
    }

    const client = new Client({
      connectionString: process.env.STAGING_DATABASE_URL,
      connectionTimeoutMillis: 10000,
      statement_timeout: 15000,
    });

    try {
      await client.connect();
      await runCleanup(client);
    } finally {
      await client.end().catch(() => {});
    }
    process.exit(0);
  }

  // 3. Concurrency Verification Mode
  const clientConfig = {
    connectionString: process.env.STAGING_DATABASE_URL,
    connectionTimeoutMillis: 10000,
    statement_timeout: 15000,
  };

  const client1 = new Client(clientConfig);
  const client2 = new Client(clientConfig);

  try {
    console.log("🔌 Connecting Client 1 & Client 2 to Staging Database...");
    await client1.connect();
    await client2.connect();

    // Set bounded transaction and lock timeouts on both persistent sessions
    await client1.query("SET statement_timeout = '15s';");
    await client1.query("SET lock_timeout = '10s';");
    await client2.query("SET statement_timeout = '15s';");
    await client2.query("SET lock_timeout = '10s';");

    // Verify distinct backend PIDs
    const pidRes1 = await client1.query("SELECT pg_backend_pid() AS pid;");
    const pidRes2 = await client2.query("SELECT pg_backend_pid() AS pid;");
    const pid1 = pidRes1.rows[0].pid;
    const pid2 = pidRes2.rows[0].pid;

    if (pid1 === pid2) {
      throw new Error(`Connections share the same PID (${pid1}). Two distinct connections required.`);
    }
    console.log(`✓ Connected two independent PostgreSQL sessions: Client 1 (PID: ${pid1}), Client 2 (PID: ${pid2}).\n`);

    // Run Pre-Flight Validations
    await runPreflightChecks(client1);

    // Execute Concurrency Scenarios
    await runScenarioA(client1, client2, pid2);
    await runScenarioB(client1, client2, pid2);
    await runScenarioC(client1, client2, pid2);

    console.log("=======================================================");
    console.log("🎉 ALL TWO-SESSION CONCURRENCY VERIFICATIONS PASSED!");
    console.log("=======================================================");
  } catch (err) {
    console.error("❌ CONCURRENCY VERIFICATION FAILURE:", err.message);
    try {
      await client1.query("ROLLBACK;");
    } catch {}
    try {
      await client2.query("ROLLBACK;");
    } catch {}
    process.exit(1);
  } finally {
    await client1.end().catch(() => {});
    await client2.end().catch(() => {});
  }
}

import path from "path";
import { fileURLToPath } from "url";

// Only invoke main when run directly as CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((err) => {
    console.error("FATAL ERROR:", err.message);
    process.exit(1);
  });
}
