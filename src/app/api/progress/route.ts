import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { uuid, scan_count } = await request.json();

    if (!uuid || typeof scan_count !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT uuid FROM UserProgress WHERE uuid = ?').get(uuid);

    if (existing) {
      db.prepare('UPDATE UserProgress SET scan_count = ?, last_updated = CURRENT_TIMESTAMP WHERE uuid = ?').run(scan_count, uuid);
    } else {
      db.prepare('INSERT INTO UserProgress (uuid, scan_count) VALUES (?, ?)').run(uuid, scan_count);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
