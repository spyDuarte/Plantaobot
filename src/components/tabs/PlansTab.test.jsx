import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlansTab from './PlansTab.jsx';

vi.mock('../../services/billingApi.js', () => ({
  createCheckoutSession: vi.fn(),
  createPortalSession: vi.fn(),
}));

import { createCheckoutSession, createPortalSession } from '../../services/billingApi.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PlansTab', () => {
  it('renders all 3 plans (Free, Pro, Premium)', () => {
    render(<PlansTab planId="free" />);

    // "Grátis" appears as both plan label and price — getAllByText handles multiple matches
    expect(screen.getAllByText('Grátis').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('marks current plan with "Plano atual" badge', () => {
    render(<PlansTab planId="pro" />);

    expect(screen.getByText('Plano atual')).toBeInTheDocument();
  });

  it('upgrade button calls createCheckoutSession with planId', async () => {
    createCheckoutSession.mockResolvedValue({ url: 'https://checkout.stripe.com/test' });
    // jsdom doesn't support location.href assignment — suppress the error
    delete window.location;
    window.location = { href: '' };

    render(<PlansTab planId="free" />);

    fireEvent.click(screen.getByRole('button', { name: /Assinar Pro/i }));

    await waitFor(() => {
      expect(createCheckoutSession).toHaveBeenCalledWith({ planId: 'pro' });
    });
  });

  it('shows error message when checkout fails', async () => {
    createCheckoutSession.mockRejectedValue(new Error('Stripe indisponível'));

    render(<PlansTab planId="free" />);

    fireEvent.click(screen.getByRole('button', { name: /Assinar Pro/i }));

    await waitFor(() => {
      expect(screen.getByText('Stripe indisponível')).toBeInTheDocument();
    });
  });

  it('"Gerenciar assinatura" calls createPortalSession for paid plan', async () => {
    createPortalSession.mockResolvedValue({ url: 'https://billing.stripe.com/test' });

    render(<PlansTab planId="pro" />);

    fireEvent.click(screen.getByRole('button', { name: /Gerenciar assinatura/i }));

    await waitFor(() => {
      expect(createPortalSession).toHaveBeenCalledTimes(1);
    });
  });
});
