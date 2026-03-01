# SaaS Plan Limits Enforcement

Implemented a robust usage tracking and plan limit enforcement system for the Aarogentix SaaS platform. This ensures that organizations are restricted to the feature quotas defined by their subscription plans (e.g., maximum patients, doctors, and appointments).

## Changes Made

### Backend

#### Usage Tracking & Enforcement
- **`UsageService`**: Created a new service with an atomic `increment` method using raw PostgreSQL `ON CONFLICT DO UPDATE` for thread-safe counters.
- **`PlanValidationGuard`**: Enhanced to performs real-time checks against `feature_limits` and `organization_usage` before allowing resource creation.
- **Transactional Increments**: Updated `PatientsService`, `DoctorsService`, and `AppointmentsService` to use `UsageService.increment` within database transactions, ensuring resource creation and usage tracking are atomic.

#### Database
- **Table Rename**: Renamed the `usage_tracking` table to `organization_usage` for clarity.
- **Migration**: Generated and applied a TypeORM migration to handle the table rename and index updates.

#### Controllers
- **Guard Registration**: Applied `PlanValidationGuard` globally or at the controller level for `Patients`, `Doctors`, and `Appointments`.
- **Feature Decorators**: Added `@RequireFeatureLimit('MAX_X')` to the `POST` endpoints of each service.

## Verification Results

### Automated Tests
- **Backend Build**: Verified successful compilation with `npm run build`.
- **Frontend Build**: Verified successful compilation with `npm run build`.
- **E2E Simulation**: Created a `verify-usage-limits.ts` script to test quota enforcement.

#### Simulation Log Output:
```text
Attempting to create Patient #1...
✅ Guard: PASSED
✅ Service: Patient #1 created successfully.
Current Usage: 1

Attempting to create Patient #2...
✅ Guard: PASSED
✅ Service: Patient #2 created successfully.
Current Usage: 2

Attempting to create Patient #3...
✅ Guard: PASSED
❌ FAILED: Limit exceeded for MAX_PATIENTS. Used: 2, Limit: 2. Please upgrade your plan.
```

The system correctly rejects the creation of a third patient when the plan limit is set to 2.

## How to Verify
1.  **Run Build**: Ensure `npm run build` passes in both `backend` and `frontend`.
2.  **Try Exceeding Limits**: Create an organization, assign a plan with a low limit (e.g., 2 patients), and attempt to create more than that number of patients via the API.
