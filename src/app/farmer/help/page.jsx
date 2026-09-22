'use client';

import React from 'react';
import FarmerLayout from '@/components/farmer/FarmerLayout';
import SupportPortal from '@/components/common/SupportPortal';

const FARMER_FAQS = [
  {
    question: 'How do I book an optimal AI procurement slot?',
    answer:
      'Go to "Book Slot" or "Procurement" from the navigation menu. Select your registered crop and volume. The platform evaluates live gate crowd across nearby centres and suggests the optimal time slot with minimum waiting time.',
  },
  {
    question: 'How does the Live Queue tracking work at the Mandi?',
    answer:
      'Once your booking is confirmed, open "Live Queue". You will see the token currently being served at the counter, the number of farmers ahead of you, and real-time waiting estimates.',
  },
  {
    question: 'What documents should I bring to the procurement centre?',
    answer:
      'Please bring: (1) Your Digital Token QR code / ticket number on your mobile phone, (2) Government Photo ID (Aadhaar or Voter ID), and (3) Bank Passbook / DBT registered account details.',
  },
  {
    question: 'When is the payment credited to my bank account?',
    answer:
      'Upon inspection and weighbridge verification at the centre, an official bill is generated. Funds are settled via Direct Benefit Transfer (DBT) directly into your bank account within 24 to 48 hours.',
  },
  {
    question: 'Can I cancel or reschedule an active procurement slot?',
    answer:
      'Yes, visit "Bookings" or "Crops", click on your active booking, and choose "Reschedule Slot" to pick another available timing, or cancel it if your harvest is delayed.',
  },
];

export default function FarmerHelpPage() {
  return (
    <FarmerLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '16px 8px 48px' }}>
        <SupportPortal userRole="farmer" faqs={FARMER_FAQS} />
      </div>
    </FarmerLayout>
  );
}
