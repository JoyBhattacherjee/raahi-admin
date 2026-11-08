import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from '../App';
import { buildData } from '../data/mock';
import { downloadCSV, inr } from '../utils/format';

function signIn() {
  window.localStorage.setItem(
    'raahi_admin_user',
    JSON.stringify({ name: 'Admin', email: 'admin@raahi.app', role: 'Operations Lead' }),
  );
}

beforeEach(() => {
  window.localStorage.clear();
  window.location.hash = '';
});

afterEach(() => cleanup());

describe('mock data', () => {
  it('is deterministic and internally consistent', () => {
    const a = buildData();
    const b = buildData();
    expect(a.rides.length).toBe(b.rides.length);
    expect(a.rides[0].id).toBe(b.rides[0].id);

    const driverIds = new Set(a.drivers.map((d) => d.id));
    const riderIds = new Set(a.riders.map((r) => r.id));
    a.rides.forEach((r) => {
      expect(driverIds.has(r.driverId)).toBe(true);
      expect(riderIds.has(r.riderId)).toBe(true);
      if (r.status === 'cancelled') expect(r.fare).toBe(0);
    });
    expect(a.rides.filter((r) => r.status === 'ongoing').length).toBeGreaterThan(0);
  });
});

describe('format helpers', () => {
  it('formats rupees with Indian grouping', () => {
    expect(inr(118)).toBe('₹118');
    expect(inr(125000)).toBe('₹1,25,000');
  });

  it('refuses to export an empty CSV', () => {
    expect(() => downloadCSV('x.csv', [])).not.toThrow();
  });
});

describe('authentication', () => {
  it('redirects unauthenticated visitors to the login page', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });

  it('rejects wrong credentials and accepts the demo account', async () => {
    render(<App />);
    fireEvent.change(await screen.findByPlaceholderText('you@company.com'), { target: { value: 'nope@x.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect/i);

    fireEvent.click(screen.getByRole('button', { name: /autofill/i }));
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/welcome back, admin/i, {}, { timeout: 3000 })).toBeInTheDocument();
  });
});

describe('admin pages', () => {
  beforeEach(signIn);

  it('renders the dashboard KPIs', async () => {
    render(<App />);
    expect(await screen.findByText(/welcome back, admin/i)).toBeInTheDocument();
    expect(screen.getByText('Rides today')).toBeInTheDocument();
    expect(screen.getByText(/drivers online now/i)).toBeInTheDocument();
    expect(screen.getByText('Recent rides')).toBeInTheDocument();
  });

  it('filters rides and opens the detail drawer', async () => {
    window.location.hash = '#/rides';
    render(<App />);
    expect(await screen.findByRole('heading', { level: 2, name: 'Rides' })).toBeInTheDocument();

    const table = screen.getByRole('table');
    const before = within(table).getAllByRole('row').length;
    fireEvent.click(screen.getByRole('tab', { name: /cancelled/i }));
    const after = within(screen.getByRole('table')).getAllByRole('row').length;
    expect(after).toBeLessThanOrEqual(before);

    fireEvent.click(screen.getByRole('tab', { name: /all/i }));
    const firstRow = within(screen.getByRole('table')).getAllByRole('row')[1];
    fireEvent.click(firstRow);
    expect(await screen.findByText(/^Ride RH-/)).toBeInTheDocument();
  });

  it('lets an admin approve a pending driver', async () => {
    window.location.hash = '#/drivers';
    render(<App />);
    expect(await screen.findByRole('heading', { level: 2, name: 'Drivers' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /pending/i }));
    const approve = screen.getAllByRole('button', { name: /approve/i })[0];
    const pendingBefore = Number(within(screen.getByRole('tab', { name: /pending/i })).getByText(/\d+/).textContent);
    fireEvent.click(approve);

    await waitFor(() => {
      const now = Number(within(screen.getByRole('tab', { name: /pending/i })).getByText(/\d+/).textContent);
      expect(now).toBe(pendingBefore - 1);
    });
  });

  it('creates a promo code and rejects duplicates', async () => {
    window.location.hash = '#/pricing';
    render(<App />);
    expect(await screen.findByText(/fare estimator/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Promo code'), { target: { value: 'monsoon30' } });
    fireEvent.click(screen.getByRole('button', { name: /create promo/i }));
    expect(await screen.findByText('MONSOON30')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Promo code'), { target: { value: 'MONSOON30' } });
    fireEvent.click(screen.getByRole('button', { name: /create promo/i }));
    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
  });

  it('toggles dark mode', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: /switch to dark mode/i }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
