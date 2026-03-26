import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const pool = getDb();
    const { rows: winnerRows } = await pool.query('SELECT COUNT(*) as count FROM Winners');
    
    // Get count of users at each scan count level
    const { rows: progressStats } = await pool.query('SELECT scan_count, COUNT(*) as users FROM UserProgress GROUP BY scan_count ORDER BY scan_count DESC');

    return NextResponse.json({
      totalWinners: parseInt(winnerRows[0].count),
      progressStats: progressStats.map(stat => ({
        scan_count: stat.scan_count,
        users: parseInt(stat.users)
      }))
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
