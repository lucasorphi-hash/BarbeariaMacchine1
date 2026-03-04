import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "barbearia.db");
console.log(`Using database at: ${dbPath}`);
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('temp_store = MEMORY');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    service TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const app = express();

async function startServer() {
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/appointments", (req, res) => {
    try {
      const appointments = db.prepare("SELECT * FROM appointments ORDER BY date DESC, time DESC").all();
      console.log(`Fetched ${appointments.length} appointments`);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/debug", (req, res) => {
    try {
      const count = db.prepare("SELECT COUNT(*) as count FROM appointments").get();
      const last = db.prepare("SELECT * FROM appointments ORDER BY id DESC LIMIT 1").get();
      res.json({ 
        status: "ok", 
        database_path: dbPath,
        total_appointments: count.count,
        last_appointment: last 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/appointments", (req, res) => {
    const { customer_name, customer_phone, service, date, time, extra_time } = req.body;
    console.log("New appointment request:", { customer_name, service, date, time, extra_time });
    
    if (!customer_name || !customer_phone || !service || !date || !time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Basic date format validation (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    try {
      // Use a transaction for atomic insertion
      const insertTransaction = db.transaction((dataObj) => {
        const { customer_name, customer_phone, service, date, time, extra_time } = dataObj;
        
        // Check if slots are already taken
        const timesToCheck = [time];
        if (extra_time) timesToCheck.push(extra_time);

        for (const t of timesToCheck) {
          const existing = db.prepare("SELECT id FROM appointments WHERE date = ? AND time = ?").get(date, t);
          if (existing) {
            throw new Error(`Horário ${t} já reservado`);
          }
        }

        // Insert all slots
        const stmt = db.prepare(
          "INSERT INTO appointments (customer_name, customer_phone, service, date, time) VALUES (?, ?, ?, ?, ?)"
        );

        const info = stmt.run(customer_name, customer_phone, service, date, time);
        if (extra_time) {
          stmt.run(customer_name, customer_phone, `${service} (Parte 2)`, date, extra_time);
        }
        return info.lastInsertRowid;
      });

      const lastId = insertTransaction({ customer_name, customer_phone, service, date, time, extra_time });

      if (lastId) {
        console.log("Appointment saved successfully, ID:", lastId);
        // Verify immediately
        const verified = db.prepare("SELECT id FROM appointments WHERE id = ?").get(lastId);
        console.log("Verification check:", verified ? "SUCCESS" : "FAILED");
        res.json({ id: lastId });
      } else {
        throw new Error("Falha ao obter ID de inserção");
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
      res.status(400).json({ error: error.message || "Internal server error" });
    }
  });

  app.delete("/api/appointments/:id", (req, res) => {
    const { id } = req.params;
    const result = db.prepare("DELETE FROM appointments WHERE id = ?").run(id);
    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Appointment not found" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  // Only listen if not on Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
