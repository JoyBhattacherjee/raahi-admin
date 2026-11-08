import { useMemo, useState } from 'react';
import { Ban, Download, Mail, RotateCcw, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar, Card, EmptyState, Pagination, Segmented, Stars, StatusBadge } from '../components/ui';
import { downloadCSV, fmtDate, inr } from '../utils/format';

const PAGE_SIZE = 10;

export default function Riders() {
  const { riders, toggleRider, toast } = useApp();
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const counts = useMemo(
    () => ({
      all: riders.length,
      active: riders.filter((r) => r.status === 'active').length,
      blocked: riders.filter((r) => r.status === 'blocked').length,
    }),
    [riders],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return riders.filter(
      (r) =>
        (status === 'all' || r.status === status) &&
        (!needle || [r.name, r.id, r.email, r.phone].some((v) => v.toLowerCase().includes(needle))),
    );
  }, [riders, status, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const exportCsv = () => {
    downloadCSV(
      'raahi-riders.csv',
      filtered.map((r) => ({
        rider_id: r.id,
        name: r.name,
        phone: r.phone,
        email: r.email,
        rides: r.rides,
        spent_inr: r.spent,
        rating: r.rating,
        status: r.status,
      })),
    );
    toast(`Exported ${filtered.length} riders to CSV`);
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h2>Riders</h2>
          <p>Everyone who books rides on Raahi.</p>
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
              { value: 'active', label: 'Active', count: counts.active },
              { value: 'blocked', label: 'Blocked', count: counts.blocked },
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
                placeholder="Name, email, phone…"
                aria-label="Filter riders"
              />
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No riders found" text="Adjust the filters or search term." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Contact</th>
                  <th>Rides</th>
                  <th>Spent</th>
                  <th>Rating</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th className="right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="person">
                        <Avatar name={r.name} size={36} />
                        <div>
                          <strong>{r.name}</strong>
                          <small>{r.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="inline">
                        <Mail size={13} /> {r.email}
                      </span>
                      <small>{r.phone}</small>
                    </td>
                    <td>{r.rides}</td>
                    <td>{inr(r.spent)}</td>
                    <td>
                      <Stars value={r.rating} />
                    </td>
                    <td className="nowrap">{fmtDate(r.joined)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="right">
                      {r.status === 'blocked' ? (
                        <button type="button" className="btn btn-ghost" onClick={() => toggleRider(r.id, true)}>
                          <RotateCcw size={15} /> Unblock
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-ghost danger"
                          onClick={() => {
                            if (window.confirm(`Block ${r.name}? They will not be able to book rides.`)) toggleRider(r.id, false);
                          }}
                        >
                          <Ban size={15} /> Block
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
    </div>
  );
}
