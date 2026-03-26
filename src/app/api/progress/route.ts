import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { uuid, scan_count } = await request.json();

    if (!uuid || typeof scan_count !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const pool = getDb();
    
    // Check if exists
    const { rows } = await pool.query('SELECT uuid FROM UserProgress WHERE uuid = $1', [uuid]);

    if (rows.length > 0) {
      await pool.query('UPDATE UserProgress SET scan_count = $1, last_updated = CURRENT_TIMESTAMP WHERE uuid = $2', [scan_count, uuid]);
    } else {
      await pool.query('INSERT INTO UserProgress (uuid, scan_count) VALUES ($1, $2)', [uuid, scan_count]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
