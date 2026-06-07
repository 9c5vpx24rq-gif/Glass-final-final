const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");

app.use(cors());
app.use(express.json());

process.on('uncaughtException', (err) => {
  console.log('Uncaught error:', err.message);
});

// ─── Register ────────────────────────────────────────────────────────────────
app.get("/app/register", async (req, res) => {
  try {
    const { username, email, password } = req.query;
    const existing = await pool.query(
      "SELECT id FROM users WHERE email=$1", [email]
    );
    if (existing.rows.length > 0) {
      return res.json({ success: false, message: "Имейлът вече съществува" });
    }
    const result = await pool.query(
      "INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING *",
      [username, email, password]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.log(err.message);
    res.json({ success: false, message: "Грешка при регистрация" });
  }
});

// ─── Login ───────────────────────────────────────────────────────────────────
app.get("/app/login", async (req, res) => {
  try {
    const { username, password } = req.query;
    const result = await pool.query(
      "SELECT * FROM users WHERE name=$1 AND password=$2",
      [username, password]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.json({ success: false, message: "Невалидно потребителско име или парола" });
    }
  } catch (err) {
    console.log(err.message);
    res.json({ success: false, message: err.message });
  }
});

// ─── Delete user ─────────────────────────────────────────────────────────────
app.delete("/app/deleteuser", async (req, res) => {
  try {
    const { username } = req.query;
    await pool.query("DELETE FROM users WHERE name=$1", [username]);
    res.json({ success: true });
  } catch (err) {
    console.log(err.message);
    res.json({ success: false });
  }
});

// ─── Vote ─────────────────────────────────────────────────────────────────────
// mode:   'schools' | 'hospitals'
// button: 'orange'  | 'red'
// Mapping:
//   schools + orange  → votes_schools
//   schools + red     → votes_noschools
//   hospitals + orange → votes_hospitals
//   hospitals + red   → votes_nohospitals

const VOTE_TABLES = {
  schools_orange:   'votes_schools',
  schools_red:      'votes_noschools',
  hospitals_orange: 'votes_hospitals',
  hospitals_red:    'votes_nohospitals',
};

app.post("/app/vote", async (req, res) => {
  try {
    const { cityName, mode, button } = req.body;
    console.log("Vote received:", { cityName, mode, button });

    const key = `${mode}_${button}`;
    const table = VOTE_TABLES[key];
    console.log("Table selected:", table);
    console.log("City name bytes:", Buffer.from(cityName).toString('hex'));

    if (!table) {
      return res.json({ success: false, message: `Invalid mode/button combo: ${key}` });
    }

    const result = await pool.query(
      `INSERT INTO ${table} (city, votes)
       VALUES ($1, 1)
       ON CONFLICT (city) DO UPDATE SET votes = ${table}.votes + 1
       RETURNING *`,
      [cityName]
    );

    res.json({ success: true, votes: result.rows[0].votes });
  } catch (err) {
    console.log(err.message);
    res.json({ success: false, message: err.message });
  }
});
// ─── Report ───────────────────────────────────────────────────────────────────
app.post("/app/report", async (req, res) => {
  try {
    console.log("Report received:", req.body);
    const { latitude, longitude, reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.json({ success: false, message: "Reason is required" });
    }
    await pool.query(
      "INSERT INTO reports(latitude, longitude, reason) VALUES($1, $2, $3)",
      [latitude, longitude, reason]
    );
    res.json({ success: true });
  } catch (err) {
    console.log(err.message);
    res.json({ success: false, message: err.message });
  }
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});