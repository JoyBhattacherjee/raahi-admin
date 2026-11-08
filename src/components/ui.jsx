import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Inbox, Star, X } from 'lucide-react';
import { initials } from '../utils/format';

export function Card({ title, subtitle, action, children, className = '', flush = false }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={flush ? '' : 'card-body'}>{children}</div>
    </section>
  );
}

export function Badge({ tone = 'gray', dot = false, children }) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <i className="badge-dot" />}
      {children}
    </span>
  );
}

const AVATAR_TONES = ['#4f46e5', '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];

export function Avatar({ name, size = 36 }) {
  const hash = [...name].reduce((s, c) => s + c.charCodeAt(0), 0);
  const color = AVATAR_TONES[hash % AVATAR_TONES.length];
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `${color}22`, color }}
    >
      {initials(name)}
    </span>
  );
}

export function Stars({ value }) {
  if (value == null) return <span className="muted">—</span>;
  return (
    <span className="stars">
      <Star size={14} fill="currentColor" />
      {Number(value).toFixed(2)}
    </span>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.count != null && <em>{o.count}</em>}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, text }) {
  return (
    <div className="empty">
      <div>
        <Inbox size={28} />
      </div>
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="pagination">
      <span className="muted">
        {from}–{to} of {total}
      </span>
      <div>
        <button type="button" className="icon-btn" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        <span className="page-num">
          {page} / {pages}
        </span>
        <button type="button" className="icon-btn" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, subtitle, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`scrim ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <header>
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="drawer-body">{open && children}</div>
        {footer && <footer>{footer}</footer>}
      </aside>
    </>
  );
}

export function Toasts({ toasts }) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    completed: ['green', 'Completed'],
    ongoing: ['blue', 'Ongoing'],
    cancelled: ['red', 'Cancelled'],
    online: ['green', 'Online'],
    offline: ['gray', 'Offline'],
    pending: ['amber', 'Pending'],
    suspended: ['red', 'Suspended'],
    active: ['green', 'Active'],
    blocked: ['red', 'Blocked'],
  };
  const [tone, label] = map[status] || ['gray', status];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}
