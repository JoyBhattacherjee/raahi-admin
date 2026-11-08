import { useMemo, useState } from 'react';
import { Ban, Check, Clock, RotateCcw, Search, ShieldCheck, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RIDE_TYPES } from '../data/mock';
import { Avatar, Card, Drawer, EmptyState, Pagination, Segmented, Stars, StatusBadge } from '../components/ui';
import { compactInr, fmtDate, inr } from '../utils/format';

const PAGE_SIZE = 8;

const DOC_LABELS = {
  license: 'Driving licence',
  rc: 'Vehicle registration (RC)',
  insurance: 'Insurance',
  background: 'Background check',
};

function DriverActions({ driver, onDone }) {
  const { approveDriver, rejectDriver, suspendDriver, reinstateDriver } = useApp();

  if (driver.status === 'pending') {
    return (
      <>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            rejectDriver(driver.id);
            onDone?.();
          }}
        >
          <X size={16} /> Reject
        </button>
        <button type="button" className="btn btn-primary" onClick={() => approveDriver(driver.id)}>
          <Check size={16} /> Approve
        </button>
      </>
    );
  }
  if (driver.status === 'suspended') {
    return (
      <button type="button" className="btn btn-primary" onClick={() => reinstateDriver(driver.id)}>
        <RotateCcw size={16} /> Reinstate driver
      </button>
    );
  }
  return (
    <button
      type="button"
      className="btn btn-danger"
      onClick={() => {
        if (window.confirm(`Suspend ${driver.name}? They will go offline immediately.`)) suspendDriver(driver.id);
      }}
    >
      <Ban size={16} /> Suspend
    </button>
  );
}

function DriverDetail({ driver }) {
  const type = RIDE_TYPES.find((t) => t.id === driver.typeId);
  return (
    <div className="detail">
      <div className="profile-head">
        <Avatar name={driver.name} size={64} />
        <div>
          <h3>{driver.name}</h3>
          <p>
            {driver.id} · {driver.phone}
          </p>
          <StatusBadge status={driver.status} />
        </div>
      </div>

      <div className="mini-stats">
        <div>
          <small>Rating</small>
          <Stars value={driver.rating} />
        </div>
        <div>
          <small>Trips</small>
          <strong>{driver.trips.toLocaleString('en-IN')}</strong>
        </div>
        <div>
          <small>Earnings</small>
          <strong>{compactInr(driver.earnings)}</strong>
        </div>
      </div>

      <h4>Vehicle</h4>
      <div className="info-card">
        <div>
          <small>Model</small>
          <strong>{driver.vehicle}</strong>
        </div>
        <div>
          <small>Plate</small>
          <strong className="mono">{driver.plate}</strong>
        </div>
        <div>
          <small>Category</small>
          <strong>{type?.name}</strong>
        </div>
        <div>
          <small>Joined</small>
          <strong>{fmtDate(driver.joined)}</strong>
        </div>
      </div>

      <h4>Verification</h4>
      <ul className="checklist">
        {Object.entries(DOC_LABELS).map(([key, label]) => (
          <li key={key} className={driver.docs[key] ? 'ok' : 'wait'}>
            <i>{driver.docs[key] ? <ShieldCheck size={16} /> : <Clock size={16} />}</i>
            {label}
            <em>{driver.docs[key] ? 'Verified' : 'Pending'}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Drivers() {
  const { drivers } = useApp();
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const counts = useMemo(() => {
    const c = { all: drivers.length, online: 0, offline: 0, pending: 0, suspended: 0 };
    drivers.forEach((d) => {
      c[d.status] += 1;
    });
    return c;
  }, [drivers]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return drivers.filter(
      (d) =>
        (status === 'all' || d.status === status) &&
        (type === 'all' || d.typeId === type) &&
        (!needle || [d.name, d.id, d.plate, d.vehicle].some((v) => v.toLowerCase().includes(needle))),
    );
  }, [drivers, status, type, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const selected = drivers.find((d) => d.id === selectedId) || null;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h2>Drivers</h2>
          <p>Onboard new partners and keep your fleet healthy.</p>
        </div>
      </div>

      {counts.pending > 0 && (
        <div className="callout">
          <Clock size={20} />
          <div>
            <strong>{counts.pending} applications are waiting for review</strong>
            <span>Verify documents and approve drivers so they can start earning.</span>
          </div>
          <button
            type="button"
            className="btn btn-soft"
            onClick={() => {
              setStatus('pending');
              setPage(1);
            }}
          >
            Review now
          </button>
        </div>
      )}

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
              { value: 'online', label: 'Online', count: counts.online },
              { value: 'offline', label: 'Offline', count: counts.offline },
              { value: 'pending', label: 'Pending', count: counts.pending },
              { value: 'suspended', label: 'Suspended', count: counts.suspended },
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
                placeholder="Name, ID, plate…"
                aria-label="Filter drivers"
              />
            </div>
            <select
              className="select"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              aria-label="Vehicle category"
            >
              <option value="all">All categories</option>
              {RIDE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No drivers found" text="Adjust the filters or search term." />
        ) : (
          <div className="table-wrap">
            <table className="data clickable">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Vehicle</th>
                  <th>Rating</th>
                  <th>Trips</th>
                  <th>Earnings</th>
                  <th>Status</th>
                  <th className="right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} onClick={() => setSelectedId(d.id)}>
                    <td>
                      <div className="person">
                        <Avatar name={d.name} size={36} />
                        <div>
                          <strong>{d.name}</strong>
                          <small>{d.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{d.vehicle}</strong>
                      <small className="mono">{d.plate}</small>
                    </td>
                    <td>
                      <Stars value={d.rating} />
                    </td>
                    <td>{d.trips.toLocaleString('en-IN')}</td>
                    <td>{inr(d.earnings)}</td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="right" onClick={(e) => e.stopPropagation()}>
                      {d.status === 'pending' ? (
                        <div className="row-actions">
                          <DriverActions driver={d} />
                        </div>
                      ) : (
                        <button type="button" className="btn btn-ghost" onClick={() => setSelectedId(d.id)}>
                          View
                        </button>
                      )}
                    </td>
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
        title="Driver profile"
        subtitle={selected ? selected.id : ''}
        footer={selected && <div className="drawer-actions"><DriverActions driver={selected} onDone={() => setSelectedId(null)} /></div>}
      >
        {selected && <DriverDetail driver={selected} />}
      </Drawer>
    </div>
  );
}
