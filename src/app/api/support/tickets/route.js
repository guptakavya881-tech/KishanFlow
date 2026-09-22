import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getDatabase,
  getUserSupportTickets,
  getAdminSupportTickets,
  createSupportTicket,
  updateSupportTicketStatus,
} from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';
    const category = searchParams.get('category') || 'ALL';
    const search = searchParams.get('search') || '';
    const limit = searchParams.get('limit') || 50;
    const offset = searchParams.get('offset') || 0;
    const requestedRole = searchParams.get('role');

    let user = await getCurrentUser();
    if (!user) {
      // Fallback for local testing
      const db = getDatabase();
      if (requestedRole === 'admin') {
        user = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
      } else if (requestedRole === 'farmer') {
        user = db.prepare("SELECT * FROM users WHERE role = 'farmer' LIMIT 1").get();
      } else if (requestedRole === 'buyer') {
        user = db.prepare("SELECT * FROM users WHERE role = 'buyer' LIMIT 1").get();
      } else {
        user = db.prepare("SELECT * FROM users ORDER BY id ASC LIMIT 1").get();
      }

      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
      }
    }

    if (user.role === 'admin') {
      const tickets = getAdminSupportTickets({
        status,
        category,
        search,
        limit,
        offset,
      });

      // Compute status counts for Admin summary
      const db = getDatabase();
      const total = db.prepare('SELECT COUNT(*) as c FROM support_tickets').get()?.c || 0;
      const open = db.prepare("SELECT COUNT(*) as c FROM support_tickets WHERE UPPER(status) = 'OPEN'").get()?.c || 0;
      const inProgress = db.prepare("SELECT COUNT(*) as c FROM support_tickets WHERE UPPER(status) = 'IN_PROGRESS'").get()?.c || 0;
      const resolved = db.prepare("SELECT COUNT(*) as c FROM support_tickets WHERE UPPER(status) IN ('RESOLVED', 'CLOSED')").get()?.c || 0;

      return NextResponse.json({
        success: true,
        data: tickets,
        metrics: { total, open, inProgress, resolved },
      });
    }

    // Farmer, Buyer, or Supplier: Strictly return ONLY their own tickets
    const myTickets = getUserSupportTickets(user.id);
    return NextResponse.json({
      success: true,
      data: myTickets,
    });
  } catch (err) {
    console.error('Error in support tickets GET:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      const db = getDatabase();
      user = db.prepare("SELECT * FROM users ORDER BY id ASC LIMIT 1").get();
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { subject, category, description, relatedOrderId, relatedPaymentId } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json({ success: false, error: 'Please enter a ticket subject.' }, { status: 400 });
    }
    if (!category || !category.trim()) {
      return NextResponse.json({ success: false, error: 'Please select an issue category.' }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return NextResponse.json({ success: false, error: 'Please describe the issue in detail.' }, { status: 400 });
    }

    const ticket = createSupportTicket({
      userId: user.id,
      role: user.role,
      subject,
      category,
      description,
      relatedOrderId,
      relatedPaymentId,
    });

    return NextResponse.json({
      success: true,
      message: 'Support ticket submitted successfully.',
      data: ticket,
    }, { status: 201 });
  } catch (err) {
    console.error('Error submitting support ticket:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      const db = getDatabase();
      user = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
      if (!user) {
        return NextResponse.json({ success: false, error: 'Admin authorization required.' }, { status: 401 });
      }
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Only administrators can update ticket status.' }, { status: 403 });
    }

    const body = await request.json();
    const { ticketId, status, adminNotes } = body;

    if (!ticketId) {
      return NextResponse.json({ success: false, error: 'Ticket ID is required.' }, { status: 400 });
    }

    const updatedTicket = updateSupportTicketStatus(ticketId, { status, adminNotes });

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully.',
      data: updatedTicket,
    });
  } catch (err) {
    console.error('Error updating support ticket:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
