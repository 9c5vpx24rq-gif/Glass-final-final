const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

app.use(cors());
app.use(express.json());

process.on('uncaughtException', (err) => {
  console.log('Uncaught error:', err.message);
});

// ─── Имейл ───────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'glass.signals.bg@gmail.com',
    pass: 'hyhy rdlv axid vfbs',
  }
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
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING *",
      [username, email, hashedPassword]
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
      "SELECT * FROM users WHERE name=$1",
      [username]
    );
    if (result.rows.length === 0) {
      return res.json({ success: false, message: "Невалидно потребителско име или парола" });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.json({ success: false, message: "Невалидно потребителско име или парола" });
    }
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
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
const VOTE_TABLES = {
  schools_orange:   'votes_schools',
  schools_red:      'votes_noschools',
  hospitals_orange: 'votes_hospitals',
  hospitals_red:    'votes_nohospitals',
};

const EMAIL_THRESHOLD = 1;

app.post("/app/vote", async (req, res) => {
  try {
    const { cityName, mode, button } = req.body;
    console.log("Vote received:", { cityName, mode, button });

    const key = `${mode}_${button}`;
    const table = VOTE_TABLES[key];
    console.log("Table selected:", table);

    if (!table) {
      return res.json({ success: false, message: `Invalid mode/button combo: ${key}` });
    }

    const query = `
      INSERT INTO ${table} (city, votes)
      VALUES ($1, 1)
      ON CONFLICT (city) DO UPDATE SET votes = EXCLUDED.votes + 1
      RETURNING *
    `;

    const result = await pool.query(query, [cityName]);
    const votes = result.rows[0].votes;
    console.log("Vote result:", result.rows[0]);

    //изпраща имейл при достигнат праг
    if (votes === EMAIL_THRESHOLD) {
      const modeText = mode === 'hospitals' ? 'болнична помощ' : 'образование';
      const problemText = button === 'red'
        ? `В населеното място липсва ${modeText === 'болнична помощ' ? 'лечебно заведение' : 'учебно заведение'}.`
        : `${modeText === 'болнична помощ' ? 'Лечебното' : 'Учебното'} заведение в населеното място не функционира пълноценно.`;
 
      try {
        await transporter.sendMail({
          from: 'glass.signals.bg@gmail.com',
          to: 'darinkazhekova@gmail.com',
          subject: `GLASS: Граждански сигнал за ${cityName} изисква внимание`,
          text: `
До Община Бургас,
 
Обръщаме се към Вас от името на гражданите, използващи платформата GLASS — система за граждански сигнали, която проследява проблеми с публични услуги в България.
 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ОБЕКТ: ${cityName}
ЗАСЕГНАТА УСЛУГА: ${modeText.toUpperCase()}
БРОЙ СИГНАЛИ: ${votes}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
${votes} граждани са сигнализирали, че ${problemText.toLowerCase()}
 
Тези хора живеят в района и са лично засегнати от липсата или неизправността на тази услуга. Всеки сигнал е подаден индивидуално и доброволно чрез платформата.
 
Настояваме за:
— Проверка на текущото състояние на обекта
— Предприемане на конкретни мерки в разумен срок
— Публична обратна връзка към засегнатите граждани
 
Това писмо е генерирано автоматично при достигане на ${EMAIL_THRESHOLD} граждански сигнала. При въпроси можете да се свържете с нас на glass.signals.bg@gmail.com.
 
С уважение,
Платформа GLASS
Граждански Локална Активност & Социална Сигнализация
          `,
        });
        console.log(`Имейл изпратен за ${cityName}`);
      } catch (mailErr) {
        console.log("Имейл грешка:", mailErr.message);
      }
    }
 
    res.json({ success: true, votes });
  } catch (err) {
    console.error("Vote error:", err.message);
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

app.listen(5000, '0.0.0.0', () => {
  console.log("Server started on http://0.0.0.0:5000");
});