# BUG FIX SPECIFICATION: Logic & Auth

## Goal
Resolve the "Login Loop" and session persistence issues between the React frontend and Laravel backend.

## Identified Issues
1.  **Login Loop**: Circular navigation in `App.tsx` where auth state changes trigger infinite screen resets.
2.  **Session Persistence**: Intermittent loss of tokens or failure to re-authenticate on refresh.
3.  **API Mapping**: Discrepancies between Laravel's `ApiResponse` structure and frontend expectations in `api.ts`.

## Strategic Fixes
- **AuthContext.tsx**: 
  - Refine state transitions during `isLoading` → `finished`.
  - Ensure token rehydration happens before any screen rendering to prevent "flash of welcome".
- **App.tsx Logic**:
  - Decouple route identification from screen state.
  - Implement a dedicated "Router" logic that doesn't rely solely on `useEffect` synchronization.
- **api.ts Optimization**:
  - Consolidate `adminFetch` into the main `request` wrapper.
  - Hard-harden the error handling for 401 (Unauthorized) to ensure a clean logout/redirect.

## Verification
- Successful 200 OK captured from `/api/auth/me` on page refresh.
- Zero "Login Error" states reachable in `AdminLoginScreen.tsx`.
- Persistent session across 3 manual page refreshes.
