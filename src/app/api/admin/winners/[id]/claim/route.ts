import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { claim_status } = await request.json();

    if (typeof claim_status !== 'boolean') {
      return NextResponse.json({ error: 'Invalid claim_status' }, { status: 400 });
    }

    const pool = getDb();
    await pool.query('UPDATE Winners SET claim_status = $1 WHERE id = $2', [claim_status, id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating claim status:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
