import express from "express";
import { Pool } from "pg";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

// Load environment variables
dotenv.config();
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_SERVICE:", process.env.EMAIL_SERVICE);


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files (your HTML, CSS, JS files)
app.use(express.static('public'));

// PostgreSQL connection using environment variables
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "pampanga_restaurant",
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

// Initialize tables
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tables (
        id SERIAL PRIMARY KEY,
        table_number INT NOT NULL UNIQUE,
        capacity INT NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        table_id INT REFERENCES tables(id),
        guest_name VARCHAR(100) NOT NULL,
        guest_email VARCHAR(100) NOT NULL,
        guest_phone VARCHAR(20),
  party_size INT NOT NULL CHECK (party_size > 0 AND party_size <= 10),
        reservation_date DATE NOT NULL,
        reservation_time TIME NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed tables (6 tables, only if empty)
    const result = await pool.query("SELECT COUNT(*) FROM tables");
    if (parseInt(result.rows[0].count) === 0) {
      // Use an explicit seed array so we can control capacities (including larger tables)
      const seedCapacities = [2, 2, 4, 4, 10]; // two 2-tops, two 4-tops, one 10-tops
      for (let i = 1; i <= seedCapacities.length; i++) {
        await pool.query(
          "INSERT INTO tables (table_number, capacity) VALUES ($1, $2)",
          [i, seedCapacities[i - 1]]
        );
      }
      console.log("✅ Seeded tables");
    }
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// Initialize database on startup
initDB();

// Hardcoded operating hours (5pm–10pm)
const OPEN_HOUR = 17;
const CLOSE_HOUR = 22;

function generateTimeSlots() {
  let slots = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    slots.push(`${h}:00:00`, `${h}:30:00`);
  }
  return slots;
}

// Nodemailer setup (only if email credentials are provided)
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: process.env.Email_Service,
    auth: {
      user: process.env.Email_User,
      pass: process.env.Email_Password,
    },
  });
} else {
  console.log('⚠️  Email not configured - reservation confirmations will be logged instead');
}

async function sendConfirmationEmail(reservation) {
  const message = `Hello ${reservation.guest_name}, 
Your reservation for ${reservation.party_size} guests on ${reservation.reservation_date} at ${reservation.reservation_time} is confirmed. Your confirmation number is ${reservation.confirmationNumber}.

Thank you!`;

  if (transporter) {
    try {
      const mailOptions = {
        from: process.env.Email_User,
        to: process.env.Email_User,
        subject: "Your Reservation Confirmation",
        text: message,
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`📧 Confirmation email sent to ${process.env.Email_User}`);
    } catch (error) {
      console.error('❌ Email send error:', error);
    }
  } else {
    console.log('📧 Reservation confirmation (email not configured):');
    console.log(message);
  }
}

// ---- API Endpoints ----

// Restaurant info endpoint (for your api.js)
app.get("/api/restaurant/:id", async (req, res) => {
  res.json({
    id: 1,
    name: "Mckenie's Pampanga Filipino Restaurant",
    address: "123 Main Street, Your City, State 12345",
    phone: "(555) 123-4567",
    email: "info@bayanihanrestaurant.com",
    isOpen: true,
    status: 'open',
    operatingHours: [
      { day_of_week: 0, open_time: '17:00', close_time: '22:00', is_closed: false },
      { day_of_week: 1, open_time: '17:00', close_time: '22:00', is_closed: false },
      { day_of_week: 2, open_time: '17:00', close_time: '22:00', is_closed: false },
      { day_of_week: 3, open_time: '17:00', close_time: '22:00', is_closed: false },
      { day_of_week: 4, open_time: '17:00', close_time: '22:00', is_closed: false },
      { day_of_week: 5, open_time: '17:00', close_time: '22:00', is_closed: false },
      { day_of_week: 6, open_time: '17:00', close_time: '22:00', is_closed: false },
    ]
  });
});

// Check availability
app.get("/api/availability", async (req, res) => {
  const { date, partySize } = req.query;

  if (!date || !partySize) {
    return res.status(400).json({ error: "Missing date or party size" });
  }

  try {
    const slots = generateTimeSlots();
    const availableSlots = [];

    for (const slot of slots) {
      const reservations = await pool.query(
        `SELECT t.* FROM tables t
         WHERE t.capacity >= $1
         AND t.id NOT IN (
           SELECT r.table_id FROM reservations r
           WHERE r.reservation_date = $2
           AND r.status = 'active'
           AND (
             r.reservation_time BETWEEN $3::time AND ($3::time + interval '2 hours')
             OR ($3::time BETWEEN r.reservation_time AND r.reservation_time + interval '2 hours')
           )
         )`,
        [partySize, date, slot]
      );

      if (reservations.rows.length > 0) {
        availableSlots.push(slot);
      }
    }

    res.json({ availableSlots });
  } catch (err) {
    console.error("Error checking availability:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Create a reservation
app.post("/api/reservations", async (req, res) => {
  try {
    console.log("Received reservation request with body:", req.body);
  let { guestName, guestEmail, guestPhone, partySize, date, time } = req.body;

    console.log("Reservation request:", req.body);

    if (!guestName || !guestEmail || !partySize || !date || !time) {
      console.error("Validation Error: Missing required fields.", req.body);
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Ensure time is in HH:MM:SS format
    if (time.length === 5) time += ':00';

    // Defensive parsing for numeric fields
    partySize = parseInt(partySize, 10);
    if (Number.isNaN(partySize) || partySize <= 0) {
      return res.status(400).json({ error: "Invalid party size" });
    }

    // Enforce maximum party size on server-side (must match DB constraint)
    if (partySize > 10) {
      return res.status(409).json({ error: `Party size (${partySize}) exceeds maximum allowed (10). Please contact the restaurant for large parties.` });
    }

    // Quick check: if requested party size is larger than any single table's capacity,
    // return a clear error (combine-tables logic would be more complex and is optional).
    const maxCapRes = await pool.query('SELECT MAX(capacity) as max_capacity FROM tables');
    const maxCapacity = maxCapRes.rows && maxCapRes.rows[0] ? parseInt(maxCapRes.rows[0].max_capacity, 10) : 0;
    if (partySize > maxCapacity) {
      console.log(`Requested party size ${partySize} exceeds max table capacity ${maxCapacity}`);
      return res.status(409).json({ error: `Party size (${partySize}) exceeds largest table capacity (${maxCapacity}). Please contact the restaurant to accommodate larger parties.` });
    }

    // Find an available table using a clear interval-overlap test
    const tables = await pool.query(
      `SELECT * FROM tables t
       WHERE capacity >= $1
       AND t.id NOT IN (
         SELECT r.table_id FROM reservations r
         WHERE r.reservation_date = $2
         AND r.status = 'active'
         AND (
           r.reservation_time < ($3::time + interval '2 hours')
           AND (r.reservation_time + interval '2 hours') > $3::time
         )
       )
       ORDER BY capacity ASC
       LIMIT 1`,
      [partySize, date, time]
    );

    // Log when no tables are available (and show conflicting reservations)
    if (tables.rows.length === 0) {
      console.log(`No available tables for ${date} at ${time} for party size ${partySize}`);

      const conflictRes = await pool.query(
        `SELECT r.* FROM reservations r
         WHERE r.reservation_date = $1
         AND r.status = 'active'
         AND (
           r.reservation_time < ($2::time + interval '2 hours')
           AND (r.reservation_time + interval '2 hours') > $2::time
         )
         ORDER BY r.reservation_time`,
        [date, time]
      );

      console.log('Conflicting reservations:', conflictRes.rows);

      return res.status(409).json({ error: "No available tables for this time slot" });
    }

    const table = tables.rows[0];


    // Insert reservation
    const insertQuery = `
      INSERT INTO reservations
      (table_id, guest_name, guest_email, guest_phone, party_size, reservation_date, reservation_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [table.id, guestName, guestEmail, guestPhone, partySize, date, time]);
    const reservation = result.rows[0];

    await sendConfirmationEmail(reservation);

    const confirmationNumber = 'RES' + reservation.id.toString().padStart(6, '0');

    res.status(201).json({
      ...reservation,
      confirmationNumber,
      message: "Reservation created successfully"
    });

  } catch (err) {
    console.error("Error creating reservation:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// Get reservation by ID or confirmation number
app.get("/api/reservations/:id", async (req, res) => {
  try {
    let query = "SELECT * FROM reservations WHERE id = $1";
    let param = req.params.id;
    
    // If it looks like a confirmation number, search by ID extracted from it
    if (req.params.id.startsWith('RES')) {
      param = parseInt(req.params.id.substring(3));
    }
    
    const result = await pool.query(query, [param]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching reservation:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Cancel reservation
app.delete("/api/reservations/:id", async (req, res) => {
  try {
    let param = req.params.id;
    
    // If it looks like a confirmation number, search by ID extracted from it
    if (req.params.id.startsWith('RES')) {
      param = parseInt(req.params.id.substring(3));
    }
    
    const result = await pool.query(
      "UPDATE reservations SET status = 'cancelled' WHERE id = $1 RETURNING *",
      [param]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    res.json({ 
      success: true,
      message: "Reservation cancelled successfully", 
      reservation: result.rows[0] 
    });
  } catch (err) {
    console.error("Error cancelling reservation:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running!", timestamp: new Date().toISOString() });
});

app.get("/api/test-email", async (req, res) => {
    if (!transporter) {
        return res.status(500).json({ error: "Email not configured" });
    }

    try {
        await transporter.sendMail({
            from: process.env.Email_User,
            to: 'konradky@gmail.com',
            subject: "Test Email",
            text: "This is a test email from your application.",
        });
        res.json({ message: "Test email sent successfully" });
    } catch (error) {
        console.error("Error sending test email:", error);
        res.status(500).json({ error: "Failed to send test email" });
    }
});

// Serve your main page
app.get("/", (req, res) => {
  // Use process.cwd() so this file works when running as an ES module
  // (where __dirname is not defined) and in other environments.
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Admin: Check http://localhost:${PORT}/api/health for server status`);
});
