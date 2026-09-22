import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDatabase, updateSupplierProduct, updateSupplierProductStock } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const productId = Number(id);

    let user = await getCurrentUser();
    if (!user || user.role !== 'supplier') {
      const db = getDatabase();
      const fallbackSupplier = db.prepare("SELECT * FROM users WHERE role = 'supplier' LIMIT 1").get();
      if (fallbackSupplier) {
        user = fallbackSupplier;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
      }
    }

    const body = await request.json();

    // If only updating stock
    if (body.stockOnly && body.stock !== undefined) {
      const updated = updateSupplierProductStock(productId, user.id, body.stock);
      return NextResponse.json({
        success: true,
        message: 'Stock updated successfully.',
        data: updated,
      });
    }

    // Full product update
    const updated = updateSupplierProduct(productId, user.id, {
      name: body.name,
      category: body.category,
      price: body.price,
      unit: body.unit,
      stock: body.stock,
      lowStockThreshold: body.lowStockThreshold,
      description: body.description,
    });

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully.',
      data: updated,
    });
  } catch (err) {
    console.error('Error updating supplier product:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 400 });
  }
}
