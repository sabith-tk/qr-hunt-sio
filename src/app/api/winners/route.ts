import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { full_name, phone_number } = await request.json();

    if (!full_name || !phone_number) {
      return NextResponse.json({ error: 'Name and phone number are required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('INSERT INTO Winners (full_name, phone_number) VALUES (?, ?)').run(full_name, phone_number);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving winner:', error);
    return NextResponse.json({ error: 'Failed to save winner' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getDb();
    const winners = db.prepare('SELECT id, full_name, phone_number, timestamp, claim_status FROM Winners ORDER BY timestamp DESC').all();
    return NextResponse.json(winners);
  } catch (error) {
    console.error('Error fetching winners:', error);
    return NextResponse.json({ error: 'Failed to fetch winners' }, { status: 500 });
  }
}
