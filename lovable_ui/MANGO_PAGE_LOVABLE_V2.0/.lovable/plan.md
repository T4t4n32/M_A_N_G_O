

## Plan: Fix Authentication Flow & Add Admin/Registration

### Root Cause
The frontend calls `/api/v1/auth/login`, `/api/v1/auth/status`, and `/api/v1/auth/logout` but the backend expects `/api/v1/users/login`, `/api/v1/users/status`, and `/api/v1/users/logout`. This mismatch causes 401 errors.

### Changes

#### 1. Fix API endpoints (`src/lib/api.ts`)
- Change `/auth/login` to `/users/login`
- Change `/auth/status` to `/users/status`  
- Change `/auth/logout` to `/users/logout`
- Add `register` function: `POST /users/register` with body `{ email, password, name, role }`
- Add `getUsers` and `deleteUser` functions for admin management

#### 2. Update types (`src/types/dashboard.ts`)
- Add `RegisterRequest` type: `{ email, password, name, role }`
- Add `UserRole` type: `"admin" | "viewer"`
- Extend `AuthStatus.user` to include `role` field
- Add `UserRecord` type for admin user list

#### 3. Add show/hide password toggle to Login (`src/pages/Login.tsx`)
- Add eye/eye-off icon button next to password field
- Toggle input type between `password` and `text`
- Add session bootstrap: if already authenticated on mount, redirect to `/dashboard`

#### 4. Session bootstrap on Login page (`src/pages/Login.tsx`)
- Call `checkAuth` on mount; if authenticated, redirect to dashboard immediately
- Prevents authenticated users from seeing login again

#### 5. Create Admin page (`src/pages/Admin.tsx`)
- User management table: list all registered users
- Registration form: email, password, name, role selector
- Delete user capability (admin only)
- Clean, institutional design matching dashboard aesthetic

#### 6. Role-based protected route (`src/components/ProtectedRoute.tsx`)
- Add optional `requiredRole` prop
- If role required and user lacks it, redirect to dashboard (not login)
- Pass user role from `useAuth` hook

#### 7. Update useAuth hook (`src/hooks/useAuth.ts`)
- Return `role` from user data
- Expose it for role-based UI decisions

#### 8. Add Admin route (`src/App.tsx`)
- Add `/admin` route wrapped in `<ProtectedRoute requiredRole="admin">`

### Files modified
- `src/lib/api.ts` — fix 3 endpoint paths, add register/admin functions
- `src/types/dashboard.ts` — add RegisterRequest, UserRole, UserRecord types
- `src/pages/Login.tsx` — password toggle, session bootstrap redirect
- `src/hooks/useAuth.ts` — expose role
- `src/components/ProtectedRoute.tsx` — add role-based protection
- `src/App.tsx` — add /admin route
- `src/pages/Admin.tsx` — new admin/registration page

