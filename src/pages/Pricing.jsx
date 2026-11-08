import { useState } from 'react';
import { Plus, Trash2, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge, Card, EmptyState, Toggle } from '../components/ui';
import { fmtDate, inr } from '../utils/format';

const estimate = (t, km, min) => Math.round((t.base + t.perKm * km + t.perMin * min) * t.surge);

function NumberField({ label, prefix, suffix, value, onChange, step = 1, min = 0 }) {
  return (
    <label className="num-field">
      <span>{label}</span>
      <div className="field compact">
        {prefix && <em>{prefix}</em>}
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            onChange(Number.isNaN(n) ? 0 : Math.max(min, n));
          }}
        />
        {suffix && <em>{suffix}</em>}
      </div>
    </label>
  );
}

function RideTypeCard({ type, km, min }) {
  const { updateRideType, toast } = useApp();
  return (
    <div className={`type-card ${type.enabled ? '' : 'disabled'}`} style={{ '--c': type.color }}>
      <header>
        <span className="type-dot" />
        <div>
          <h4>{type.name}</h4>
          <small>{type.seats} seat{type.seats > 1 ? 's' : ''}</small>
        </div>
        {type.surge > 1 && (
          <Badge tone="amber">
            <Zap size={12} /> {type.surge.toFixed(1)}× surge
          </Badge>
        )}
        <Toggle
          checked={type.enabled}
          label={`Enable ${type.name}`}
          onChange={(v) => {
            updateRideType(type.id, { enabled: v });
            toast(`${type.name} ${v ? 'enabled' : 'disabled'}`, v ? 'success' : 'warning');
          }}
        />
      </header>

      <div className="num-grid">
        <NumberField label="Base fare" prefix="₹" value={type.base} onChange={(v) => updateRideType(type.id, { base: v })} />
        <NumberField label="Per km" prefix="₹" value={type.perKm} step={0.5} onChange={(v) => updateRideType(type.id, { perKm: v })} />
        <NumberField label="Per minute" prefix="₹" value={type.perMin} step={0.1} onChange={(v) => updateRideType(type.id, { perMin: v })} />
      </div>

      <label className="slider">
        <span>
          Surge multiplier <b>{type.surge.toFixed(1)}×</b>
        </span>
        <input
          type="range"
          min="1"
          max="3"
          step="0.1"
          value={type.surge}
          onChange={(e) => updateRideType(type.id, { surge: parseFloat(e.target.value) })}
        />
      </label>

      <footer>
        <span>
          {km} km · {min} min
        </span>
        <strong>{inr(estimate(type, km, min))}</strong>
      </footer>
    </div>
  );
}

function PromoForm({ existing, onCreate }) {
  const { toast } = useApp();
  const defaultExpiry = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const [code, setCode] = useState('');
  const [kind, setKind] = useState('percent');
  const [value, setValue] = useState(20);
  const [max, setMax] = useState(60);
  const [expires, setExpires] = useState(defaultExpiry);

  const submit = (e) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!clean) return toast('Enter a promo code', 'warning');
    if (existing.some((p) => p.code === clean)) return toast(`${clean} already exists`, 'warning');
    if (value <= 0) return toast('Discount must be greater than zero', 'warning');
    onCreate({
      code: clean,
      kind,
      value,
      max: kind === 'flat' ? value : max,
      expires: new Date(`${expires}T23:59:59`).getTime(),
    });
    setCode('');
    return undefined;
  };

  return (
    <form className="promo-form" onSubmit={submit}>
      <label className="num-field grow">
        <span>Code</span>
        <div className="field compact">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. MONSOON30" maxLength={16} aria-label="Promo code" />
        </div>
      </label>
      <label className="num-field">
        <span>Type</span>
        <select className="select" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Discount type">
          <option value="percent">Percent off</option>
          <option value="flat">Flat amount</option>
        </select>
      </label>
      <NumberField label={kind === 'percent' ? 'Percent' : 'Amount'} prefix={kind === 'flat' ? '₹' : undefined} suffix={kind === 'percent' ? '%' : undefined} value={value} onChange={setValue} />
      {kind === 'percent' && <NumberField label="Max discount" prefix="₹" value={max} onChange={setMax} />}
      <label className="num-field">
        <span>Expires</span>
        <div className="field compact">
          <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} aria-label="Expiry date" />
        </div>
      </label>
      <button type="submit" className="btn btn-primary">
        <Plus size={16} /> Create promo
      </button>
    </form>
  );
}

export default function Pricing() {
  const { rideTypes, promos, addPromo, togglePromo, deletePromo } = useApp();
  const [km, setKm] = useState(10);
  const [min, setMin] = useState(28);

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h2>Pricing &amp; promos</h2>
          <p>Fine-tune fares per ride type and run offers that bring riders back.</p>
        </div>
      </div>

      <Card title="Fare estimator" subtitle="Preview what riders will pay on a sample trip">
        <div className="estimator">
          <NumberField label="Distance" suffix="km" value={km} onChange={setKm} step={0.5} />
          <NumberField label="Duration" suffix="min" value={min} onChange={setMin} />
          <div className="estimates">
            {rideTypes.map((t) => (
              <div key={t.id} className={t.enabled ? '' : 'off'} style={{ '--c': t.color }}>
                <i />
                <span>{t.name.replace('Raahi ', '')}</span>
                <strong>{t.enabled ? inr(estimate(t, km, min)) : 'Off'}</strong>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="type-grid">
        {rideTypes.map((t) => (
          <RideTypeCard key={t.id} type={t} km={km} min={min} />
        ))}
      </div>

      <Card title="Promo codes" subtitle="Create, pause or retire offers" flush>
        <div className="card-body">
          <PromoForm existing={promos} onCreate={addPromo} />
        </div>

        {promos.length === 0 ? (
          <EmptyState title="No promo codes" text="Create your first offer above." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Uses</th>
                  <th>Expires</th>
                  <th>Active</th>
                  <th className="right" />
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => {
                  const expired = p.expires < Date.now();
                  return (
                    <tr key={p.id}>
                      <td>
                        <span className="code">{p.code}</span>
                      </td>
                      <td>{p.kind === 'percent' ? `${p.value}% off · up to ${inr(p.max)}` : `Flat ${inr(p.value)} off`}</td>
                      <td>{p.uses.toLocaleString('en-IN')}</td>
                      <td>
                        {fmtDate(p.expires)} {expired && <Badge tone="red">Expired</Badge>}
                      </td>
                      <td>
                        <Toggle checked={p.active && !expired} label={`Toggle ${p.code}`} onChange={(v) => !expired && togglePromo(p.id, v)} />
                      </td>
                      <td className="right">
                        <button type="button" className="icon-btn danger" aria-label={`Delete ${p.code}`} onClick={() => deletePromo(p.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
