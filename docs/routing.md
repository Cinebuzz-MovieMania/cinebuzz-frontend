# Routing

Defined in [`src/App.jsx`](../src/App.jsx) using `react-router-dom` v7.

## Public (no auth)

| Path | Component | Notes |
|------|-----------|-------|
| `/login` | `pages/Login.jsx` | Outside `AppShell` — no navbar/sidebar. |
| `/register` | `pages/Register.jsx` | OTP-based registration. |
| `/forgot-password` | `pages/ForgotPassword.jsx` | Email + 8-char reset code flow. |

## Browse (inside `AppShell`)

| Path | Component | Notes |
|------|-----------|-------|
| `/` | `pages/Home.jsx` | Movie + showtime browse. Open to guests. |

`AppShell` wraps these with `Navbar` (and admin sidebar if user has admin role).

## Authenticated user

Wrapped in `<ProtectedRoute>`:

| Path | Component |
|------|-----------|
| `/booking/checkout` | `BookingCheckout` |
| `/booking/seats-unavailable` | `BookingSeatUnavailable` |
| `/booking/confirmation` | `BookingConfirmation` |
| `/bookings` | `MyBookings` |
| `/profile` | `Profile` |

## Admin (any admin)

Wrapped in `<ProtectedRoute adminOnly>` — accessible by `ROLE_ADMIN` or `ROLE_SUPER_ADMIN`:

| Path | Component |
|------|-----------|
| `/admin/cities` | `AdminCities` |
| `/admin/theatres` | `AdminTheatres` |
| `/admin/screens` | `AdminScreens` |
| `/admin/movies` | `AdminMovies` |
| `/admin/movies/:movieId` | `AdminMovieDetail` |
| `/admin/persons` | `AdminPersons` |
| `/admin/showtimes` | `AdminShowtimes` |

## Super-admin only

Wrapped in `<ProtectedRoute superAdminOnly>` — only `ROLE_SUPER_ADMIN`:

| Path | Component |
|------|-----------|
| `/admin/users` | `AdminUsers` |

## How `ProtectedRoute` works

- Reads the user from `AuthContext` (`useAuth()`).
- If no user → redirect to `/login`.
- If `adminOnly` → require `isAdmin()` (true for both `ROLE_ADMIN` and `ROLE_SUPER_ADMIN`).
- If `superAdminOnly` → require `isSuperAdmin()`.

Backend enforces the same rules at the URL level (see `cinebuzz-backend/docs/auth.md`); the frontend check is for UX only.
