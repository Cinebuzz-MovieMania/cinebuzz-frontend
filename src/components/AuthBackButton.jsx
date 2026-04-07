/** Top-left chevron; dismisses panel or goes back a step (caller decides). */
export function AuthBackButton({ onClick, ariaLabel = "Back" }) {
  return (
    <button type="button" className="login-card-back" onClick={onClick} aria-label={ariaLabel}>
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 18l-6-6 6-6"
        />
      </svg>
    </button>
  );
}
