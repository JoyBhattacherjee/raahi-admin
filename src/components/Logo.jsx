export default function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="raahi-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="19" fill="url(#raahi-logo-grad)" />
      <path d="M18 49 C18 28 46 40 46 19" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
      <circle cx="18" cy="49" r="4.5" fill="#fff" />
      <circle cx="46" cy="18" r="6.5" fill="#f59e0b" stroke="#6366f1" strokeWidth="2" />
    </svg>
  );
}
