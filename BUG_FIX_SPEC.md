# BUG FIX SPEC: Admin Logic & Persistence (Moments V2)

## 1. Problem: Authentication Loop
- **Symptom**: App redirects between `/login` and `/admin` indefinitely on initial mount.
- **Root Cause**: `AuthContext` initialization (`isLoading: true`) triggers the `ProtectedRoute` redirect logic in `App.tsx` before the `/me` check completes.
- **Solution**: 
    - Introduced `hasInitialized` ref/state in `App.tsx` to delay routing decisions until the first `isLoading` flip from the `AuthContext`.
    - Added explicit `!isLoading` checks in `ProtectedRoute` and `PublicRoute`.

## 2. Problem: Session Fragmentation
- **Symptom**: Page refresh occasionally drops the admin session.
- **Root Cause**: Race condition between `api.getToken()` and the `useEffect` in `AuthContext`.
- **Solution**: 
    - Standardized `token` as part of the `AuthState`.
    - Automated token re-validation on mount with a 200 OK verification.

## 3. Problem: Dashboard Syntax Corruption
- **Symptom**: Production build failure (`npm run build`).
- **Root Cause**: Partial file replacement tools injected orphaned JSX tags at the end of `AdminScreen.tsx`.
- **Solution**: 
    - Cleaned `AdminScreen.tsx` body.
    - Exported missing `NeuTextArea` from `Neumorphic.tsx` to restore legacy `UploadScreen.tsx` compatibility.

## 4. Verification Protocol
- **Build Status**: Must return Exit Code 0.
- **200 OK Verification**: `api.me()` must return user data after refresh if `localStorage` contains a valid token.
