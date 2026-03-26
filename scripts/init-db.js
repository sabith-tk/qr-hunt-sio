const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');

// Check if database already exists
if (fs.existsSync(dbPath)) {
  console.log('Database already exists at', dbPath);
  process.exit(0);
}

const db = new Database(dbPath);

console.log('Initializing database...');

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS Locations (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    valuable_message TEXT NOT NULL,
    hint_for_others TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Winners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    claim_status BOOLEAN DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS UserProgress (
    uuid TEXT PRIMARY KEY,
    scan_count INTEGER NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed Locations Table
const insertLocation = db.prepare('INSERT INTO Locations (id, name, valuable_message, hint_for_others) VALUES (?, ?, ?, ?)');

const getRndmValMsg = (i) => {
  const msgs = [
    "You found the hidden server room. Keep this quiet!",
    "The admin password was set to 'password123'. We changed it.",
    "This node is routing 40% of the traffic.",
    "The firewall configuration here is completely bypassed.",
    "You've accessed the mainframe. Only one step left."
  ];
  return msgs[i-1];
};

const getRndmHint = (i) => {
  const hints = [
    "Look where the noise of cooling fans is the loudest.",
    "It's hidden near the front desk where everyone signs in.",
    "Check the place where we usually grab coffee.",
    "It's near the emergency exit on the second floor.",
    "Look up! It's attached to the projector in the main hall."
  ];
  return hints[i-1];
};

const seedLocations = [
  { id: 1, name: "Location 1" },
  { id: 2, name: "Location 2" },
  { id: 3, name: "Location 3" },
  { id: 4, name: "Location 4" },
  { id: 5, name: "Location 5" }
];

db.transaction(() => {
  for (const loc of seedLocations) {
    insertLocation.run(loc.id, loc.name, getRndmValMsg(loc.id), getRndmHint(loc.id));
  }
})();

console.log('Database initialized successfully with seeded locations.');

db.close();
