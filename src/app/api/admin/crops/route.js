import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAdminCropsList, getAdminCropMetrics, getAdminCropDetails } from '@/lib/db';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const details = getAdminCropDetails(Number(id));
      if (!details) {
        return NextResponse.json({ success: false, error: 'Crop listing not found.' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: details,
      });
    }

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 100;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;

    const crops = getAdminCropsList({ search, status, limit, offset });
    const metrics = getAdminCropMetrics();

    return NextResponse.json({
      success: true,
      data: {
        crops,
        metrics,
        total: crops.length,
      },
    });
  } catch (err) {
    console.error('Error in /api/admin/crops:', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
