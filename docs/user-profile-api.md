# User profile system

The profile system uses three D1 records with separate responsibilities:

- `users_profile`: identity, public account details, learning preferences, XP, streak, and last-active timestamps.
- `user_courses`: enrollment status and per-course progress lifecycle.
- `user_activity_logs`: append-only learning and account events with small JSON metadata objects.
- `transactions`: the current payment/order state.
- `payment_status_logs`: append-only payment status transitions, including who changed them and why.

The original `user_progress.progress_data` JSON record remains supported for offline-client synchronization. New course-level progress belongs in `user_courses`; detailed events belong in `user_activity_logs`.

## Apply the migration

Run the versioned migration before deploying code that reads the new columns:

```sh
npx wrangler d1 migrations apply sirithai-db --local
npx wrangler d1 migrations apply sirithai-db --remote
```

The production command changes the configured remote D1 database. Export or use D1 Time Travel before production schema changes according to the deployment policy.

## API routes

### `GET /api/profile?userId=...`

Returns the complete profile, every enrollment, aggregate course/activity metrics, recent activity, paginated payments, recent payment events, and totals grouped by status and currency. `activityLimit`/`activityOffset` paginate activity; `paymentLimit`/`paymentOffset` paginate payments; `paymentEventLimit` controls recent status events. Limits have a maximum of 100. The legacy `totalPurchasedCourses` response field is retained.

### `PATCH /api/profile`

Updates a profile using snake_case or camelCase field names. Editable values are `full_name`, `email`, `avatar_url`, `phone`, `bio`, `preferred_language`, `timezone`, `country`, `learning_goal`, and `daily_goal_minutes`. Role, XP, streak, and internal timestamps cannot be changed through this route.

```json
{
  "userId": "user_123",
  "bio": "Learning Thai for work",
  "preferredLanguage": "my",
  "dailyGoalMinutes": 30
}
```

### `GET /api/user-courses?userId=...`

Returns accessible courses with enrollment progress and lifecycle timestamps.

### `PATCH /api/user-courses`

Updates an existing approved/active/completed enrollment. It never creates or grants enrollment access. A 100% value marks the course complete.

```json
{
  "userId": "user_123",
  "courseId": "course-basic",
  "completedLessons": 8,
  "totalLessons": 10,
  "progressPercent": 80
}
```

### `GET /api/activity-logs?userId=...`

Returns reverse-chronological activity. Optional parameters are `activityType`, `limit` (maximum 100), and `offset`. `/api/activities` is an alias.

### `POST /api/activity-logs`

Appends a custom activity for an existing user. Activity types are normalized lowercase identifiers containing letters, numbers, and underscores. Metadata must be a JSON object no larger than 8 KiB.

```json
{
  "userId": "user_123",
  "activityType": "lesson_completed",
  "courseId": "course-basic",
  "lessonId": "lesson-8",
  "metadata": { "score": 92 }
}
```

Profile synchronization, legacy progress synchronization, enrollment submission, payment approval, and Clerk user webhooks also append activity automatically. Telemetry failures in those existing flows are non-blocking, so an unavailable log table cannot discard a payment or progress update.

### `GET /api/payment-logs?userId=...`

Returns append-only payment transitions in reverse chronological order. Use `transactionId` instead of `userId` to inspect one payment. `limit` (maximum 100) and `offset` provide pagination. Payment log writes are internal: payment submission, admin approval/cancellation, order status updates, and deletion create audit events atomically with their primary database change.

Each event includes `previous_status`, `new_status`, `changed_by`, an optional reason, metadata, and its timestamp. Existing transactions receive a baseline migration event marked with `metadata.historicalSnapshot`; this records their state at migration time without claiming an earlier transition history.

## Access control

These endpoints follow the project's existing user-ID-based API contract. Before exposing private profiles or payment history to untrusted clients, add server-side Clerk token verification and require the authenticated subject to match `userId`; administrative cross-user access and payment mutations should be checked separately by role. Client-provided `changedBy` and `X-Admin-Id` values are audit labels, not authentication controls.
