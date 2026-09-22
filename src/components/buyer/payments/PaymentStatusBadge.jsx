'use client';

import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

export default function PaymentStatusBadge({ status }) {
  const norm = (status || '').toUpperCase().trim();

  let bg = '#f0fdf4';
  let color = '#15803d';
  let border = '#bbf7d0';
  let label = 'Paid';
  let Icon = CheckCircle2;

  if (norm === 'PAID' || norm === 'PAYMENT RECEIVED' || norm === 'SUCCESS' || norm === 'SUCCESSFUL') {
    bg = '#dcfce7';
    color = '#15803d';
    border = '#86efac';
    label = 'Paid';
    Icon = CheckCircle2;
  } else if (norm === 'PROCESSING' || norm === 'PAYMENT PROCESSING') {
    bg = '#eff6ff';
    color = '#2563eb';
    border = '#bfdbfe';
    label = 'Payment Processing';
    Icon = Clock;
  } else if (norm === 'FAILED' || norm === 'PAYMENT FAILED') {
    bg = '#fee2e2';
    color = '#b91c1c';
    border = '#fca5a5';
    label = 'Payment Failed';
    Icon = XCircle;
  } else {
    // PENDING
    bg = '#fef3c7';
    color = '#b45309';
    border = '#fde68a';
    label = 'Payment Pending';
    Icon = AlertCircle;
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 800,
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        letterSpacing: '0.01em',
      }}
    >
      <Icon size={13} />
      <span>{label}</span>
    </span>
  );
}
