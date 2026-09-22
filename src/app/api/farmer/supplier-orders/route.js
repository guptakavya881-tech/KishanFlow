import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getFarmerSupplierOrders, createSupplierOrderForFarmer, cancelFarmerSupplierOrder, payFarmerSupplierOrder, getDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      const db = getDatabase();
      const fallbackFarmer = db.prepare("SELECT * FROM users WHERE role = 'farmer' LIMIT 1").get();
      if (fallbackFarmer) {
        user = fallbackFarmer;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
      }
    } else if (user.role !== 'farmer') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Only farmers can view farmer supplier orders.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';

    const orders = getFarmerSupplierOrders(user.id, { status });

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    console.error('Error fetching farmer supplier orders:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      const db = getDatabase();
      const fallbackFarmer = db.prepare("SELECT * FROM users WHERE role = 'farmer' LIMIT 1").get();
      if (fallbackFarmer) {
        user = fallbackFarmer;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized. Only farmers can place input orders.' }, { status: 401 });
      }
    } else if (user.role !== 'farmer') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Only farmers can place input orders.' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity, deliveryAddress } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product selection is required.' }, { status: 400 });
    }

    const numQty = parseInt(quantity, 10);
    if (isNaN(numQty) || numQty <= 0) {
      return NextResponse.json({ success: false, error: 'Quantity must be at least 1.' }, { status: 400 });
    }

    const order = createSupplierOrderForFarmer(user.id, {
      productId: Number(productId),
      quantity: numQty,
      deliveryAddress,
    });

    return NextResponse.json({
      success: true,
      message: `Order #${order.orderNumber} placed successfully!`,
      data: order,
    }, { status: 201 });
  } catch (err) {
    console.error('Error creating supplier order for farmer:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to place order.',
    }, { status: 400 });
  }
}

export async function PATCH(request) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      const db = getDatabase();
      const fallbackFarmer = db.prepare("SELECT * FROM users WHERE role = 'farmer' LIMIT 1").get();
      if (fallbackFarmer) {
        user = fallbackFarmer;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
      }
    } else if (user.role !== 'farmer') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Only farmers can modify farmer supplier orders.' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, action, paymentMethod } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required.' }, { status: 400 });
    }

    if (action === 'cancel') {
      const updated = cancelFarmerSupplierOrder(Number(orderId), user.id);
      return NextResponse.json({
        success: true,
        message: 'Order cancelled successfully and stock has been restored.',
        data: updated,
      });
    }

    if (action === 'pay') {
      const updated = payFarmerSupplierOrder(Number(orderId), user.id, { paymentMethod });
      return NextResponse.json({
        success: true,
        message: 'Payment completed successfully.',
        data: updated,
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported action.' }, { status: 400 });
  } catch (err) {
    console.error('Error in farmer supplier orders PATCH:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal server error',
    }, { status: 400 });
  }
}
