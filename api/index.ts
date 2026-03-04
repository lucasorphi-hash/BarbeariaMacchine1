import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ajuste do caminho do banco de dados (agora ele está na pasta raiz, um nível acima da pasta api)
const dbPath = path.join(__dirname, "..", "barbearia.db");
console.log(`Using database at: ${dbPath}`);
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('temp_store = MEMORY');

// Inicialização do banco de dados
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

  // Rotas da API
  app.get("/api/appointments", (req, res) => {
    try {
      const appointments = db.prepare("SELECT * FROM appointments ORDER BY date DESC, time DESC").all();
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
    
    if (!customer_name || !customer_phone || !service || !date || !time) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes" });
    }

    try {
      const insertTransaction = db.transaction((dataObj) => {
        const { customer_name, customer_phone, service, date, time, extra_time } = dataObj;
        
        const timesToCheck = [time];
        if (extra_time) timesToCheck.push(extra_time);

        for (const t of timesToCheck) {
          const existing = db.prepare("SELECT id FROM appointments WHERE date = ? AND time = ?").get(date, t);
          if (existing) {
            throw new Error(`Horário ${t} já reservado`);
          }
        }

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
      res.json({ id: lastId });
    } catch (error) {
      res.status(400).json({ error: error.message || "Erro interno do servidor" });
    }
  });

  app.delete("/api/appointments/:id", (req, res) => {
    const { id } = req.params;
    const result = db.prepare("DELETE FROM appointments WHERE id = ?").run(id);
    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Agendamento não encontrado" });
    }
  });

  // Configuração para produção na Vercel
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "..", "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
    });
  }

  // Só inicia o servidor se não estiver na Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
