/** Resolves `from` passed as Link state (`{ from: location }` or string path). */
export function getReturnPathFromAuthState(from) {
  if (!from) return null;
  if (typeof from === "string") return from;
  if (typeof from === "object" && from.pathname != null) {
    return `${from.pathname}${from.search || ""}${from.hash || ""}`;
  }
  return null;
}

export function isAuthRoutePath(path) {
  const base = path.split("?")[0].split("#")[0];
  return base === "/login" || base === "/register";
}

/** After closing login/register: go back to `from`, and re-apply Home UI via `home` when returning to `/`. */
export function navigateAfterClosingAuthPanel(navigate, locationState) {
  const from = locationState?.from;
  const home = locationState?.home;
  const path = getReturnPathFromAuthState(from);
  const target = path && !isAuthRoutePath(path) ? path : "/";
  if (target === "/" && home) {
    navigate(target, { replace: true, state: { restoreHome: home } });
  } else {
    navigate(target, { replace: true });
  }
}
