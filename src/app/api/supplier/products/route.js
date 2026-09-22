import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDatabase, getSupplierProducts, createSupplierProduct } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'ALL';
    const search = searchParams.get('search') || '';
    const lowStockOnly = searchParams.get('lowStock') === 'true';

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

    const products = getSupplierProducts(user.id, { category, search, lowStockOnly });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (err) {
    console.error('Error fetching supplier products:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
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
    const { name, category, price, unit, stock, lowStockThreshold, description } = body;

    const product = createSupplierProduct(user.id, {
      name,
      category,
      price,
      unit,
      stock,
      lowStockThreshold,
      description,
    });

    return NextResponse.json({
      success: true,
      message: 'Product created successfully.',
      data: product,
    }, { status: 201 });
  } catch (err) {
    console.error('Error creating supplier product:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 400 });
  }
}
