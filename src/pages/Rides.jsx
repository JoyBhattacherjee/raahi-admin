import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Ban, Check, Download, Phone, Search, Undo2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RIDE_TYPES } from '../data/mock';
import { Avatar, Badge, Card, Drawer, EmptyState, Pagination, Segmented, Stars, StatusBadge } from '../components/ui';
import { downloadCSV, fmtDateTime, inr } from '../utils/format';

const PAGE_SIZE = 10;

function TypeBadge({ typeId, children }) {
  const t = RIDE_TYPES.find((x) => x.id === typeId);
  return (
    <span className="type-tag" style={{ '--c': t?.color || '#4f46e5' }}>
      <i />
      {children}
    </span>
  );
}

function RideDetail({ ride }) {
  const cfg = RIDE_TYPES.find((t) => t.id === ride.typeId) || RIDE_TYPES[0];
  const distance = Math.round(cfg.perKm * ride.km);
  let time = Math.round(cfg.perMin * ride.minutes);
  let adjust = ride.fare - (cfg.base + distance + time);
  // Fold ±₹1 rounding noise into the time charge so only real surge shows up.
  if (Math.abs(adjust) <= 1) {
    time += adjust;
    adjust = 0;
  }

  const steps = [
    { label: 'Ride requested', done: true },
    { label: 'Driver assigned', done: ride.status !== 'cancelled' },
    { label: 'Rider picked up', done: ride.status === 'ongoing' || ride.status === 'completed' },
    { label: 'Dropped off', done: ride.status === 'completed' },
  ];

  return (
    <div className="detail">
      <div className="detail-hero">
        <div>
          <StatusBadge status={ride.status} />
          {ride.refunded && (
            <Badge tone="violet" dot>
              Refunded
            </Badge>
          )}
        </div>
        <div className="detail-fare">{ride.status === 'cancelled' ? '—' : inr(ride.fare)}</div>
        <small>
          {ride.km} km · {ride.minutes} min · {ride.payment}
        </small>
      </div>

      <div className="route-card">
        <div className="route-line">
          <i className="dot-from" />
          <b />
          <i className="dot-to" />
        </div>
        <div>
          <span>Pickup</span>
          <strong>{ride.from}</strong>
          <span className="gap">Drop-off</span>
          <strong>{ride.to}</strong>
        </div>
      </div>

      <h4>People</h4>
      <div className="pair">
        <div className="person-card">
          <Avatar name={ride.rider} size={40} />
          <div>
            <small>Rider</small>
            <strong>{ride.rider}</strong>
            <em>{ride.riderId}</em>
          </div>
        </div>
        <div className="person-card">
          <Avatar name={ride.driver} size={40} />
          <div>
            <small>Driver</small>
            <strong>{ride.driver}</strong>
            <em>{ride.driverId}</em>
          </div>
        </div>
      </div>

      <h4>Progress</h4>
      <ol className="steps">
        {steps.map((s) => (
          <li key={s.label} className={s.done ? 'done' : ''}>
            <i>{s.done && <Check size={12} />}</i>
            {s.label}
          </li>
        ))}
        {ride.status === 'cancelled' && (
          <li className="cancel">
            <i>
              <Ban size={11} />
            </i>
            Ride cancelled
          </li>
        )}
      </ol>

      {ride.status !== 'cancelled' && (
        <>
          <h4>Fare breakdown</h4>
          <dl className="breakdown">
            <div>
              <dt>Base fare</dt>
              <dd>{inr(cfg.base)}</dd>
            </div>
            <div>
              <dt>Distance · {ride.km} km</dt>
              <dd>{inr(distance)}</dd>
            </div>
            <div>
              <dt>Time · {ride.minutes} min</dt>
              <dd>{inr(time)}</dd>
            </div>
            {adjust !== 0 && (
              <div>
                <dt>Surge &amp; adjustments</dt>
                <dd>{adjust > 0 ? '+' : '−'}{inr(Math.abs(adjust))}</dd>
              </div>
            )}
            <div className="total">
              <dt>Total</dt>
              <dd>{inr(ride.fare)}</dd>
            </div>
          </dl>
          {ride.rating && (
            <div className="rating-row">
              <span>Rider rating</span>
              <Stars value={ride.rating} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Rides() {
  const { rides, cancelRide, refundRide, toast } = useApp();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    setQ(params.get('q') || '');
    setPage(1);
  }, [params]);

  const counts = useMemo(
    () => ({
      all: rides.length,
      completed: rides.filter((r) => r.status === 'completed').length,
      ongoing: rides.filter((r) => r.status === 'ongoing').length,
      cancelled: rides.filter((r) => r.status === 'cancelled').length,
    }),
    [rides],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const dir = sort.dir === 'asc' ? 1 : -1;
    return rides
      .filter(
        (r) =>
          (status === 'all' || r.status === status) &&
          (type === 'all' || r.typeId === type) &&
          (!needle || [r.id, r.rider, r.driver, r.from, r.to].some((v) => v.toLowerCase().includes(needle))),
      )
      .sort((a, b) => (a[sort.key] - b[sort.key]) * dir);
  }, [rides, q, status, type, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const selected = rides.find((r) => r.id === selectedId) || null;

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));

  const SortHead = ({ k, children }) => (
    <th>
      <button type="button" className="sort" onClick={() => toggleSort(k)}>
        {children}
        {sort.key === k && (sort.dir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
      </button>
    </th>
  );

  const exportCsv = () => {
    downloadCSV(
      'raahi-rides.csv',
      filtered.map((r) => ({
        ride_id: r.id,
        date: new Date(r.date).toISOString(),
        rider: r.rider,
        driver: r.driver,
        from: r.from,
        to: r.to,
        type: r.type,
        km: r.km,
        minutes: r.minutes,
        fare_inr: r.fare,
        payment: r.payment,
        status: r.status,
        refunded: r.refunded ? 'yes' : 'no',
      })),
    );
    toast(`Exported ${filtered.length} rides to CSV`);
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h2>Rides</h2>
          <p>Search, monitor and manage every trip on the platform.</p>
        </div>
        <button type="button" className="btn btn-soft" onClick={exportCsv}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <Card flush>
        <div className="toolbar">
          <Segmented
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'ongoing', label: 'Ongoing', count: counts.ongoing },
              { value: 'completed', label: 'Completed', count: counts.completed },
              { value: 'cancelled', label: 'Cancelled', count: counts.cancelled },
            ]}
          />
          <div className="toolbar-right">
            <div className="field compact">
              <Search size={16} />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Ride ID, rider, driver, place…"
                aria-label="Filter rides"
              />
            </div>
            <select
              className="select"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              aria-label="Ride type"
            >
              <option value="all">All types</option>
              {RIDE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No rides match" text="Try a different status, type or search term." />
        ) : (
          <div className="table-wrap">
            <table className="data clickable">
              <thead>
                <tr>
                  <th>Ride</th>
                  <th>Rider</th>
                  <th>Driver</th>
                  <th>Route</th>
                  <th>Type</th>
                  <SortHead k="fare">Fare</SortHead>
                  <th>Status</th>
                  <SortHead k="date">Date</SortHead>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSelectedId(r.id)}>
                    <td>
                      <strong>{r.id}</strong>
                    </td>
                    <td>
                      <div className="person">
                        <Avatar name={r.rider} size={30} />
                        {r.rider}
                      </div>
                    </td>
                    <td>{r.driver}</td>
                    <td className="route">
                      {r.from} <span>→</span> {r.to}
                    </td>
                    <td>
                      <TypeBadge typeId={r.typeId}>{r.type.replace('Raahi ', '')}</TypeBadge>
                    </td>
                    <td>{r.status === 'cancelled' ? '—' : inr(r.fare)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="nowrap">{fmtDateTime(r.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={current} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
      </Card>

      <Drawer
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected ? `Ride ${selected.id}` : ''}
        subtitle={selected ? fmtDateTime(selected.date) : ''}
        footer={
          selected && (
            <div className="drawer-actions">
              <button type="button" className="btn btn-soft" onClick={() => toast(`Calling ${selected.rider} (demo)`, 'info')}>
                <Phone size={16} /> Contact rider
              </button>
              {selected.status === 'ongoing' && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    if (window.confirm(`Cancel ride ${selected.id}? The rider will be notified.`)) cancelRide(selected.id);
                  }}
                >
                  <Ban size={16} /> Cancel ride
                </button>
              )}
              {selected.status === 'completed' && !selected.refunded && (
                <button type="button" className="btn btn-primary" onClick={() => refundRide(selected.id)}>
                  <Undo2 size={16} /> Issue refund
                </button>
              )}
            </div>
          )
        }
      >
        {selected && <RideDetail ride={selected} />}
      </Drawer>
    </div>
  );
}
