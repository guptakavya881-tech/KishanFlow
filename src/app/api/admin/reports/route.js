import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDatabase, getAdminAnalytics, getAdminReportsExportCsv } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'ALL';
    const exportFormat = searchParams.get('export');

    let user = await getCurrentUser();
    if (!user) {
      const db = getDatabase();
      user = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
      }
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Access restricted to administrators.' }, { status: 403 });
    }

    // CSV Export handler
    if (exportFormat === 'csv') {
      const csvContent = getAdminReportsExportCsv({ timeRange });
      const filename = `kishanflow_report_${timeRange.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;

      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // JSON Analytics Response
    const analytics = getAdminAnalytics({ timeRange });

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (err) {
    console.error('Error fetching admin reports/analytics:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
