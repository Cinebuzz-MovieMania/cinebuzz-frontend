# State and API

Two pieces handle "who is logged in" and "how do we call the backend":

- [`src/context/AuthContext.jsx`](../src/context/AuthContext.jsx) — React state
- [`src/services/api.js`](../src/services/api.js) — Axios instances + interceptors

## AuthContext

Stored object in `localStorage` under the key **`cinebuzz_user`**:

```json
{ "token": "<jwt>", "userId": 123, "name": "…", "email": "…", "role": "ROLE_USER" }
```

Returned by `useAuth()`:

| Field | Purpose |
|-------|---------|
| `user` | Current user object or `null`. |
| `loading` | `true` until first hydration finishes. |
| `login(userData)` | Sets state + persists to `localStorage`. |
| `logout()` | Clears state + `localStorage`. |
| `updateUser(partial)` | Merge fields into stored session (e.g. after profile edit). |
| `isAdmin()` | `true` for `ROLE_ADMIN` or `ROLE_SUPER_ADMIN`. |
| `isSuperAdmin()` | `true` only for `ROLE_SUPER_ADMIN`. |

Cross-tab sync: a `storage` event listener mirrors logins/logouts across browser tabs.

## API clients

Three Axios instances; all share the same `BASE = VITE_API_BASE || "http://localhost:8010/cinebuzz"`:

| Instance | `baseURL` | Use it for |
|----------|-----------|------------|
| `API` (default export) | `${BASE}/api/v1/admin` | Admin write/read endpoints. |
| `PublicAPI` | `${BASE}/api/v1` | Anything outside admin namespace (browse, bookings, profile). |
| `AuthAPI` | `${BASE}/api/v1/auth` | Login, register, OTP, password reset. |

### Token attachment

`API` and `PublicAPI` use a request interceptor (`attachToken`) that:
1. Reads `localStorage.cinebuzz_user`.
2. Adds `Authorization: Bearer <token>` if a token exists.

`AuthAPI` does **not** attach a token (auth endpoints are public).

### 401 handling

`API` and `PublicAPI` response interceptors call `onUnauthorized`:
- On `401`, clear `localStorage.cinebuzz_user` and redirect to `/`.

This means an expired/invalidated token boots the user out automatically on the next request.

## Calling the API

```js
import API, { PublicAPI, AuthAPI } from "../services/api";

// Public
const { data } = await PublicAPI.get(`/browse/movies`, { params: { city } });

// Authenticated user
await PublicAPI.post(`/bookings/${showtimeId}/hold`, { seatIds });

// Admin
await API.post(`/movies`, body);

// Auth flow
const { data } = await AuthAPI.post(`/login`, { email, password });
```

## Things to remember

- Anything you put in `cinebuzz_user` ends up in browser storage — keep it small (token + identity).
- The token is a JWT signed by the backend. Don’t trust it client-side beyond UX hints; backend always re-validates.
- `VITE_*` env vars are inlined at **build time**; updating production means a rebuild + redeploy.
