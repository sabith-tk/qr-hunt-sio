import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const pool = getDb();
    
    // Create Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Locations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        valuable_message TEXT NOT NULL,
        hint_for_others TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Winners (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        claim_status BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS UserProgress (
        uuid TEXT PRIMARY KEY,
        scan_count INTEGER NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if Locations are already seeded
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM Locations');
    if (parseInt(rows[0].count) === 0) {
      const getRndmValMsg = (i: number) => {
        const msgs = [
          "You found the hidden server room. Keep this quiet!",
          "The admin password was set to 'password123'. We changed it.",
          "This node is routing 40% of the traffic.",
          "The firewall configuration here is completely bypassed.",
          "You've accessed the mainframe. Only one step left."
        ];
        return msgs[i-1];
      };

      const getRndmHint = (i: number) => {
        const hints = [
          "Look where the noise of cooling fans is the loudest.",
          "It's hidden near the front desk where everyone signs in.",
          "Check the place where we usually grab coffee.",
          "It's near the emergency exit on the second floor.",
          "Look up! It's attached to the projector in the main hall."
        ];
        return hints[i-1];
      };

      for (let i = 1; i <= 5; i++) {
        await pool.query(
          'INSERT INTO Locations (id, name, valuable_message, hint_for_others) VALUES ($1, $2, $3, $4)',
          [i, `Location ${i}`, getRndmValMsg(i), getRndmHint(i)]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json({ error: 'Failed to initialize database', details: String(error) }, { status: 500 });
  }
}
