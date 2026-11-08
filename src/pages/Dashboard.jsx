import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpRight, Ban, Car, IndianRupee, TrendingDown, TrendingUp, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar, Badge, Card, Segmented, StatusBadge, Stars } from '../components/ui';
import LiveMap from '../components/LiveMap';
import { compactInr, fmtTime, inr, timeAgo } from '../utils/format';

const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
};

function buildDaily(rides, days = 14) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push({
      key: dayKey(d),
      label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      revenue: 0,
      rides: 0,
      cancelled: 0,
    });
  }
  const index = Object.fromEntries(out.map((o, i) => [o.key, i]));
  rides.forEach((r) => {
    const i = index[dayKey(r.date)];
    if (i == null) return;
    out[i].rides += 1;
    if (r.status === 'completed' && !r.refunded) out[i].revenue += r.fare;
    if (r.status === 'cancelled') out[i].cancelled += 1;
  });
  return out;
}

const sum = (arr, key) => arr.reduce((s, x) => s + x[key], 0);
const pct = (curr, prev) => (prev ? ((curr - prev) / prev) * 100 : 0);

function ChartTooltip({ active, payload, label, money }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <strong>{label}</strong>
      {payload.map((p) => (
        <div key={p.dataKey}>
          <i style={{ background: p.color || p.stroke || p.fill }} />
          {p.name}: <b>{money ? inr(p.value) : p.value}</b>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, tone, label, value, delta, spark, note }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span className={`stat-icon tone-${tone}`}>
          <Icon size={20} />
        </span>
        {delta != null && (
          <span className={`delta ${delta >= 0 ? 'up' : 'down'}`}>
            {delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {note && <span className="delta neutral">{note}</span>}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {spark && (
        <div className="spark">
          <ResponsiveContainer width="100%" height={44}>
            <AreaChart data={spark} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${tone}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={`var(--tone-${tone})`} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={`var(--tone-${tone})`} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={`var(--tone-${tone})`}
                strokeWidth={2}
                fill={`url(#spark-${tone})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { rides, drivers, rideTypes, user } = useApp();
  const [range, setRange] = useState(14);

  const daily = useMemo(() => buildDaily(rides, 14), [rides]);
  const chartData = daily.slice(-range);

  const stats = useMemo(() => {
    const last7 = daily.slice(-7);
    const prev7 = daily.slice(0, 7);
    const today = daily[daily.length - 1];
    const yesterday = daily[daily.length - 2];
    const online = drivers.filter((d) => d.status === 'online').length;
    const approved = drivers.filter((d) => d.status !== 'pending').length;
    const totalRides = sum(daily, 'rides');
    return {
      ridesToday: today.rides,
      ridesDelta: pct(today.rides, yesterday.rides),
      revenue7: sum(last7, 'revenue'),
      revenueDelta: pct(sum(last7, 'revenue'), sum(prev7, 'revenue')),
      online,
      approved,
      cancelRate: totalRides ? (sum(daily, 'cancelled') / totalRides) * 100 : 0,
      sparkRides: last7.map((d) => ({ v: d.rides })),
      sparkRevenue: last7.map((d) => ({ v: d.revenue })),
      sparkCancel: last7.map((d) => ({ v: d.cancelled })),
    };
  }, [daily, drivers]);

  const hourly = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({ h, rides: 0 }));
    rides.forEach((r) => {
      hours[new Date(r.date).getHours()].rides += 1;
    });
    const peak = Math.max(...hours.map((x) => x.rides));
    return hours.map((x) => ({
      ...x,
      label: `${x.h % 12 === 0 ? 12 : x.h % 12}${x.h < 12 ? 'a' : 'p'}`,
      peak: x.rides === peak,
    }));
  }, [rides]);

  const share = useMemo(() => {
    const done = rides.filter((r) => r.status === 'completed');
    return rideTypes.map((t) => ({
      name: t.name,
      color: t.color,
      value: done.filter((r) => r.typeId === t.id).length,
    }));
  }, [rides, rideTypes]);
  const shareTotal = share.reduce((s, x) => s + x.value, 0);

  const recent = rides.slice(0, 6);
  const topDrivers = useMemo(
    () =>
      [...drivers]
        .filter((d) => d.status !== 'pending')
        .sort((a, b) => b.trips - a.trips)
        .slice(0, 5),
    [drivers],
  );
  const ongoing = rides.filter((r) => r.status === 'ongoing').length;

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h2>Welcome back, {user?.name || 'Admin'}</h2>
          <p>{today} · here is how Raahi is performing.</p>
        </div>
      </div>

      <div className="kpis">
        <StatCard
          icon={Car}
          tone="indigo"
          label="Rides today"
          value={stats.ridesToday}
          delta={stats.ridesDelta}
          spark={stats.sparkRides}
        />
        <StatCard
          icon={IndianRupee}
          tone="green"
          label="Revenue · last 7 days"
          value={compactInr(stats.revenue7)}
          delta={stats.revenueDelta}
          spark={stats.sparkRevenue}
        />
        <StatCard
          icon={UserCheck}
          tone="sky"
          label="Drivers online now"
          value={stats.online}
          note={`of ${stats.approved}`}
        />
        <StatCard
          icon={Ban}
          tone="red"
          label="Cancellation rate · 14 days"
          value={`${stats.cancelRate.toFixed(1)}%`}
          spark={stats.sparkCancel}
        />
      </div>

      <div className="row-2-1">
        <Card
          title="Revenue"
          subtitle="Completed rides, net of refunds"
          action={
            <Segmented
              value={range}
              onChange={setRange}
              options={[
                { value: 7, label: '7 days' },
                { value: 14, label: '14 days' },
              ]}
            />
          }
        >
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} tickFormatter={compactInr} width={56} />
                <Tooltip content={<ChartTooltip money />} cursor={{ stroke: 'var(--primary)', strokeOpacity: 0.25 }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fill="url(#rev-grad)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Ride mix" subtitle="Completed rides by type">
          <div className="donut">
            <div className="donut-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={share} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} cornerRadius={6} stroke="none">
                    {share.map((s) => (
                      <Cell key={s.name} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <strong>{shareTotal}</strong>
                <span>rides</span>
              </div>
            </div>
            <ul className="legend">
              {share.map((s) => (
                <li key={s.name}>
                  <i style={{ background: s.color }} />
                  <span>{s.name}</span>
                  <b>{shareTotal ? Math.round((s.value / shareTotal) * 100) : 0}%</b>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="row-1-1">
        <Card
          title="Live fleet"
          subtitle="Online drivers moving across the city"
          action={
            <Badge tone="green" dot>
              {ongoing} trips live
            </Badge>
          }
          flush
        >
          <LiveMap drivers={drivers} />
        </Card>

        <Card title="Demand by hour" subtitle="All rides in the last 14 days">
          <div className="chart-box short">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly} margin={{ top: 10, right: 0, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} interval={2} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
                <Bar dataKey="rides" name="Rides" radius={[6, 6, 0, 0]}>
                  {hourly.map((h) => (
                    <Cell key={h.h} fill={h.peak ? 'var(--amber)' : 'var(--primary)'} fillOpacity={h.peak ? 1 : 0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="row-2-1">
        <Card
          title="Recent rides"
          action={
            <Link to="/rides" className="link">
              View all <ArrowUpRight size={15} />
            </Link>
          }
          flush
        >
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Ride</th>
                  <th>Rider</th>
                  <th>Route</th>
                  <th>Fare</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.id}</strong>
                      <small>
                        {timeAgo(r.date)} · {fmtTime(r.date)}
                      </small>
                    </td>
                    <td>
                      <div className="person">
                        <Avatar name={r.rider} size={30} />
                        {r.rider}
                      </div>
                    </td>
                    <td className="route">
                      {r.from} <span>→</span> {r.to}
                    </td>
                    <td>{r.status === 'cancelled' ? '—' : inr(r.fare)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Top drivers" subtitle="By lifetime trips">
          <ul className="rank">
            {topDrivers.map((d, i) => (
              <li key={d.id}>
                <span className="rank-n">{i + 1}</span>
                <Avatar name={d.name} size={38} />
                <div>
                  <strong>{d.name}</strong>
                  <small>{d.trips.toLocaleString('en-IN')} trips</small>
                </div>
                <Stars value={d.rating} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
