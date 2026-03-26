import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const pool = getDb();
    const { rows } = await pool.query('SELECT id, name, valuable_message, hint_for_others FROM Locations');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
