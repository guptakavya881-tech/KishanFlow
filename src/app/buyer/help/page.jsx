'use client';

import React from 'react';
import BuyerLayout from '@/components/buyer/BuyerLayout';
import SupportPortal from '@/components/common/SupportPortal';

const BUYER_FAQS = [
  {
    question: 'How do I place a procurement order for farmer crops?',
    answer:
      'Navigate to "Browse Crops" or "Find Produce". Select an available crop listing, specify your procurement volume, confirm unit pricing, and click "Order Produce". An order contract is generated and assigned to the producer.',
  },
  {
    question: 'How does mandi lot quality inspection work?',
    answer:
      'All produce dispatched through KishanFlow is graded against APMC standards at the designated procurement centre. Weighbridge certificates and moisture / quality inspection slips are digitized into your order receipt.',
  },
  {
    question: 'What is the Mandi Escrow payment process?',
    answer:
      'Payments made through KishanFlow are securely held in escrow until physical gate intake and lot weight verification are confirmed by the procurement officer. Upon verification, funds are cleared directly to the farmer.',
  },
  {
    question: 'How do I track my order delivery and gate arrival?',
    answer:
      'Open "Track Orders" in your navigation menu. You can track real-time dispatch milestones: Confirmed -> Dispatched -> Arrived at Mandi -> Inspected & Weighed -> Delivered.',
  },
  {
    question: 'What if there is a discrepancy in delivered weight or quality?',
    answer:
      'Submit a support ticket selecting "Payment Issue" or "Order Issue", and input your Order ID. Our regional mandi desk will verify the weighbridge log and issue an immediate reconciliation credit.',
  },
];

export default function BuyerHelpPage() {
  return (
    <BuyerLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '8px 4px 32px' }}>
        <SupportPortal userRole="buyer" faqs={BUYER_FAQS} />
      </div>
    </BuyerLayout>
  );
}
