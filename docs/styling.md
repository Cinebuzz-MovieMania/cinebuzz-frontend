# Styling

All app styles live in [`src/index.css`](../src/index.css). No CSS-in-JS, no Tailwind. Components use plain class names that map to selectors in this single file.

## Design tokens (`:root`)

Defined at the top of `index.css`. Change one variable, the whole UI updates.

| Variable | Meaning |
|----------|---------|
| `--primary`, `--primary-hover`, `--primary-soft`, `--primary-glow` | Brand color (currently red `#e50914` family). Used for buttons, links, focus rings. |
| `--bg`, `--bg-secondary`, `--bg-tertiary`, `--surface` | Page and card backgrounds. |
| `--text`, `--text-muted`, `--text-light` | Type colors. |
| `--border`, `--border-strong` | Card / input borders. |
| `--success`, `--danger`, `--danger-hover` | Status colors. |
| `--shadow*` | Five elevation steps (`xs`, base, `md`, `lg`, `xl`). |
| `--radius*` | Corner radii (`sm`, base, `lg`, `xl`). |
| `--focus-ring` | Standard focus glow. |
| `--sans` | Plus Jakarta Sans (Google Fonts) — loaded in `index.html`. |

> **Tip:** Re-theme by editing only the `--primary*` group.

## Component style sections

`index.css` is organized by `── Section ───` comment banners:

- **App shell** — `.app-shell`, `.app-main-column`, `.app-content`
- **Admin sidebar** — `.admin-sidebar`, nav items
- **Navbar** — `.navbar` and child elements (the top bar gradient lives here)
- **Login / Register / Forgot password** — `.login-page`, `.login-card`
- **Home / browse** — movie cards, filters, hero
- **Booking** — seat map, seat states, summary
- **Admin tables and forms**
- **Modals, dropdowns, toasts**

## Conventions

- Use existing variables — don’t hardcode colors.
- Keep selectors flat (`.movie-card-title`), avoid deep nesting.
- One component family per section. If a new component needs >50 lines of CSS, add a new section banner.
- Prefer `flex` / `grid` over absolute positioning except for overlays and dropdowns.
- Mobile width handled with media queries inside each section, not at the bottom of the file.

## Fonts

`Plus Jakarta Sans` is preconnected and loaded in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:..." rel="stylesheet" />
```

Body uses `var(--sans)` which falls back to system fonts.

## Icons

SVG sprites in `public/icons.svg`, used via `<svg><use href="/icons.svg#icon-id"/></svg>`.
