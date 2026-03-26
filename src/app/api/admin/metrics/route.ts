import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const totalWinners = db.prepare('SELECT COUNT(*) as count FROM Winners').get() as { count: number };
    
    // Get count of users at each scan count level
    const progressStats = db.prepare('SELECT scan_count, COUNT(*) as users FROM UserProgress GROUP BY scan_count ORDER BY scan_count DESC').all();

    return NextResponse.json({
      totalWinners: totalWinners.count,
      progressStats
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
