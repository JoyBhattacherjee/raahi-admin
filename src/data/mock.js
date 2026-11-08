// Deterministic mock data so the dashboard looks the same on every load.
// Swap `buildData()` for real API calls when you connect a backend.

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const RIDE_TYPES = [
  { id: 'go', name: 'Raahi Go', color: '#4f46e5', base: 40, perKm: 11, perMin: 0.5, surge: 1.0, enabled: true, seats: 4 },
  { id: 'bike', name: 'Raahi Bike', color: '#10b981', base: 20, perKm: 6, perMin: 0.3, surge: 1.0, enabled: true, seats: 1 },
  { id: 'auto', name: 'Raahi Auto', color: '#f59e0b', base: 30, perKm: 8, perMin: 0.4, surge: 1.2, enabled: true, seats: 3 },
  { id: 'premier', name: 'Raahi Premier', color: '#7c3aed', base: 70, perKm: 18, perMin: 0.8, surge: 1.0, enabled: true, seats: 4 },
];

export const PLACES = [
  'Park Street', 'Howrah Station', 'Salt Lake Sector V', 'Victoria Memorial', 'Esplanade',
  'New Town Eco Park', 'Science City', 'Gariahat Market', 'Dum Dum Airport', 'South City Mall',
  'Sealdah Station', 'Ballygunge', 'Jadavpur University', 'Tollygunge', 'Behala Chowrasta',
  'Rajarhat', 'Dakshineswar', 'Garia', 'Shyambazar', 'Kalighat',
];

const FIRST = [
  'Rahul', 'Sourav', 'Imran', 'Anita', 'Debashis', 'Priya', 'Arjun', 'Sneha', 'Amit', 'Riya',
  'Subhajit', 'Moumita', 'Tanmoy', 'Ishita', 'Rakesh', 'Pooja', 'Sandip', 'Ananya', 'Kunal', 'Swati',
  'Abhijit', 'Nandini', 'Biswajit', 'Tanushree', 'Pritam', 'Sayan', 'Mithun', 'Rupa', 'Joy', 'Koushik',
];
const LAST = [
  'Das', 'Mondal', 'Sheikh', 'Roy', 'Ghosh', 'Sen', 'Banerjee', 'Chatterjee', 'Bose', 'Dutta',
  'Mukherjee', 'Saha', 'Paul', 'Majumdar', 'Biswas', 'Halder', 'Pal', 'Sarkar', 'Nandi', 'Dey',
];
const CARS = {
  go: ['Maruti Dzire', 'Hyundai Aura', 'Tata Tiago', 'Toyota Etios'],
  bike: ['Honda Shine', 'Bajaj Pulsar', 'TVS Apache', 'Hero Splendor'],
  auto: ['Bajaj RE', 'Piaggio Ape', 'Mahindra Treo'],
  premier: ['Honda City', 'Toyota Innova', 'Hyundai Verna', 'Skoda Slavia'],
};
const HOUR_WEIGHTS = [1, 1, 1, 1, 1, 2, 4, 8, 10, 8, 5, 5, 6, 6, 5, 5, 6, 9, 11, 10, 8, 5, 3, 2];

export function buildData() {
  const R = mulberry32(2026);
  const pick = (arr) => arr[Math.floor(R() * arr.length)];
  const int = (a, b) => Math.floor(a + R() * (b - a + 1));
  const between = (a, b) => a + R() * (b - a);
  const NOW = Date.now();

  const weighted = (weights) => {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = R() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return weights.length - 1;
  };

  const fullName = () => `${pick(FIRST)} ${pick(LAST)}`;
  const phone = () => `+91 9${int(1000, 9999)} ${int(10000, 99999)}`;
  const plate = () =>
    `WB ${String(int(1, 99)).padStart(2, '0')} ${String.fromCharCode(65 + int(0, 25))}${String.fromCharCode(65 + int(0, 25))} ${int(1000, 9999)}`;

  // ----------------------------------------------------------------- drivers
  const statusPool = ['online', 'online', 'online', 'online', 'online', 'online', 'offline', 'offline', 'offline', 'pending', 'pending', 'suspended'];
  const drivers = Array.from({ length: 28 }, (_, i) => {
    const typeId = pick(['go', 'go', 'go', 'bike', 'bike', 'auto', 'premier']);
    const status = statusPool[i % statusPool.length];
    const trips = status === 'pending' ? 0 : int(80, 3200);
    return {
      id: `DRV-${1001 + i}`,
      name: fullName(),
      phone: phone(),
      typeId,
      vehicle: pick(CARS[typeId]),
      plate: plate(),
      rating: status === 'pending' ? null : Math.round(between(4.2, 5) * 100) / 100,
      trips,
      earnings: trips * int(120, 210),
      status,
      joined: NOW - int(20, 900) * 86400000,
      docs: {
        license: status !== 'pending' || R() > 0.4,
        rc: status !== 'pending' || R() > 0.3,
        insurance: status !== 'pending' || R() > 0.6,
        background: status !== 'pending',
      },
    };
  });

  // ------------------------------------------------------------------ riders
  const riders = Array.from({ length: 44 }, (_, i) => {
    const name = fullName();
    return {
      id: `RDR-${2001 + i}`,
      name,
      phone: phone(),
      email: `${name.toLowerCase().replace(' ', '.')}${int(1, 99)}@mail.com`,
      rides: int(1, 140),
      spent: int(300, 24000),
      rating: Math.round(between(4.3, 5) * 100) / 100,
      status: R() > 0.93 ? 'blocked' : 'active',
      joined: NOW - int(5, 700) * 86400000,
    };
  });

  // ------------------------------------------------------------------- rides
  const assignable = drivers.filter((d) => d.status === 'online' || d.status === 'offline');
  const makeRide = (i, { forceOngoing = false } = {}) => {
    const type = pick(RIDE_TYPES);
    const driver = pick(assignable);
    const rider = pick(riders);
    let from = pick(PLACES);
    let to = pick(PLACES);
    while (to === from) to = pick(PLACES);
    const km = Math.round(between(1.5, 19) * 10) / 10;
    const minutes = Math.round(km * 3 + between(3, 9));
    const fare = Math.round((type.base + type.perKm * km + type.perMin * minutes) * type.surge);

    let date;
    if (forceOngoing) {
      date = NOW - int(2, 28) * 60000;
    } else {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      date = startOfToday.getTime() - int(0, 13) * 86400000 + weighted(HOUR_WEIGHTS) * 3600000 + int(0, 59) * 60000;
      if (date > NOW - 35 * 60000) date = NOW - int(40, 900) * 60000;
    }

    let status = 'completed';
    if (forceOngoing) status = 'ongoing';
    else if (R() < 0.13) status = 'cancelled';

    return {
      id: `RH-${10000 + i}`,
      riderId: rider.id,
      rider: rider.name,
      driverId: driver.id,
      driver: driver.name,
      from,
      to,
      typeId: type.id,
      type: type.name,
      fare: status === 'cancelled' ? 0 : fare,
      km,
      minutes,
      status,
      date,
      payment: pick(['UPI', 'UPI', 'Wallet', 'Cash', 'Card']),
      rating: status === 'completed' ? pick([5, 5, 5, 4, 4, 3, 5, 4]) : null,
      refunded: false,
    };
  };

  const rides = [
    ...Array.from({ length: 7 }, (_, i) => makeRide(i, { forceOngoing: true })),
    ...Array.from({ length: 260 }, (_, i) => makeRide(i + 7)),
  ].sort((a, b) => b.date - a.date);

  // ------------------------------------------------------------------ promos
  const promos = [
    { id: 'p1', code: 'RAAHI50', kind: 'percent', value: 50, max: 80, uses: 1284, expires: NOW + 21 * 86400000, active: true },
    { id: 'p2', code: 'FIRSTRIDE', kind: 'flat', value: 40, max: 40, uses: 3420, expires: NOW + 60 * 86400000, active: true },
    { id: 'p3', code: 'WEEKEND25', kind: 'percent', value: 25, max: 60, uses: 612, expires: NOW + 9 * 86400000, active: true },
    { id: 'p4', code: 'DIWALI100', kind: 'flat', value: 100, max: 100, uses: 2210, expires: NOW - 3 * 86400000, active: false },
  ];

  return { drivers, riders, rides, promos, rideTypes: RIDE_TYPES.map((t) => ({ ...t })) };
}
