const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");

process.on('uncaughtException', (err) => {
  console.log('Uncaught error:', err.message);
});

app.use(cors());
app.use(express.json());

// INSERT new user
app.post("/app/login", async (req, res) => {
  console.log("Request received:", req.body);
  try {
    const { username, email, password } = req.body;
    const newuser = await pool.query(
      "INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING *",
      [username, email, password]
    );
    res.json(newuser.rows[0]);
    console.log(newuser.rows[0]);
  } catch (err) {
    console.log(err.message);
  }
});

// GET / check login
app.get("/app/login", async (req, res) => {
  console.log("Login attempt:", req.query);
  try {
    const { username, password } = req.query;
    const result = await pool.query(
      "SELECT * FROM users WHERE name=$1 AND password=$2",
      [username, password]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.json({ success: false, message: "Invalid username or password" });
    }
  } catch (err) {
    console.log(err.message);
  }
});

// VOTE
// VOTE
app.post("/app/vote", async (req, res) => {
  try {
    const { cityName } = req.body;
    console.log("Vote received for:", cityName);

    const result = await pool.query(
      "UPDATE votes SET votes = votes + 1 WHERE name=$1 RETURNING *",
      [cityName]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, message: "City not found in votes table" });
    }

    res.json({ success: true, votes: result.rows[0].votes });
  } catch (err) {
    console.log(err.message);
    res.json({ success: false, message: err.message });
  }
});


app.listen(5000, () => {
  console.log("server has started on port 5000");
});