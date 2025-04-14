require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to each DB separately
const db1 = mongoose.createConnection("mongodb+srv://neeshu:YC7pQ0Unf32NKHi7@neeshu.cwxzomm.mongodb.net/Game1Skin?retryWrites=true&w=majority&appName=neeshu");
const db2 = mongoose.createConnection("mongodb+srv://neeshu:YC7pQ0Unf32NKHi7@neeshu.cwxzomm.mongodb.net/Game2?retryWrites=true&w=majority&appName=neeshu");
const db3 = mongoose.createConnection("mongodb+srv://neeshu:YC7pQ0Unf32NKHi7@neeshu.cwxzomm.mongodb.net/Game3HairGrowth?retryWrites=true&w=majority&appName=neeshu");

const playerSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  score: Number,
  stars: Number,
});

// Models per DB
const Player1 = db1.model('Player', playerSchema, 'players');
const Player2 = db2.model('Player', playerSchema, 'players');
const Player3 = db3.model('Player', playerSchema, 'players');

// Submit Endpoint
app.post('/submit', async (req, res) => {
  const { name, email, phone, gameName } = req.body;

  let Model = gameName === 'game1' ? Player1
            : gameName === 'game2' ? Player2
            : gameName === 'game3' ? Player3
            : null;

  if (!Model) return res.status(400).json({ error: "Invalid game name" });

  try {
    const newPlayer = new Model({ name, email, phone, score: 0, stars: 0 });
    await newPlayer.save();
    res.json({ message: 'User saved', id: newPlayer._id });
  } catch (err) {
    res.status(500).json({ error: 'Error saving player' });
  }
});

// Save score endpoint
app.patch('/save-score', async (req, res) => {
  const { id, gameName, score, stars } = req.body;

  let Model = gameName === 'game1' ? Player1
            : gameName === 'game2' ? Player2
            : gameName === 'game3' ? Player3
            : null;

  if (!Model) return res.status(400).json({ error: "Invalid game name" });

  try {
    const updated = await Model.findByIdAndUpdate(id, { score, stars }, { new: true });
    res.json({ message: "Updated", user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/admin', async (req, res) => {
    const adminPassword = 'Ubik@123'; // change if needed
  
    if (req.query.password !== adminPassword) {
      return res.status(401).send('❌ Unauthorized. Incorrect password.');
    }
  
    res.send(`
      <html>
        <head>
          <title>Admin Panel</title>
          <style>
            body {
              font-family: Arial;
              background: #f2f2f2;
              text-align: center;
              padding-top: 100px;
            }
            h1 {
              color: #333;
            }
            button {
              padding: 12px 30px;
              margin: 15px;
              background-color: #4facfe;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 18px;
              cursor: pointer;
            }
            button:hover {
              background-color: #00c6ff;
            }
          </style>
        </head>
        <body>
          <h1>🎮 Admin Dashboard</h1>
          <p>Select Game:</p>
          <button onclick="location.href='/admin/game1?password=${req.query.password}'">Game 1 Skin</button>
          <button onclick="location.href='/admin/game2?password=${req.query.password}'">Game 2</button>
          <button onclick="location.href='/admin/game3?password=${req.query.password}'">Game 3 Hair Growth</button>
        </body>
      </html>
    `);
  });
  
// Admin Dashboard
app.get('/admin-login', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>Admin Login</title>
          <style>
            body {
              font-family: sans-serif;
              background: #f0f8ff;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }
            .login-box {
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 5px 20px rgba(0,0,0,0.2);
              text-align: center;
            }
            input {
              padding: 10px;
              font-size: 16px;
              width: 80%;
              margin-bottom: 20px;
            }
            button {
              padding: 10px 20px;
              background: #4facfe;
              color: white;
              border: none;
              border-radius: 5px;
              font-size: 16px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <div class="login-box">
            <h2>🔐 Admin Login</h2>
            <form onsubmit="event.preventDefault(); login();">
              <input type="password" id="pwd" placeholder="Enter Admin Password" />
              <br/>
              <button type="submit">Login</button>
            </form>
          </div>
          <script>
            function login() {
              const pwd = document.getElementById('pwd').value;
              window.location.href = '/admin?password=' + encodeURIComponent(pwd);
            }
          </script>
        </body>
      </html>
    `);
  });
  
  app.get('/admin/:game', async (req, res) => {
    const adminPassword = 'Ubik@123';
    const game = req.params.game;
    const pass = req.query.password;
  
    if (pass !== adminPassword) {
      return res.status(401).send('❌ Unauthorized');
    }
  
    let players = [];
  
    try {
      if (game === 'game1') {
        players = await Game1Player.find();
      } else if (game === 'game2') {
        players = await Game2Player.find();
      } else if (game === 'game3') {
        players = await Game3Player.find();
      } else {
        return res.status(404).send('Game not found');
      }
  
      res.send(`
        <html>
          <head>
            <title>${game} Players</title>
            <style>
              table { width: 90%; margin: auto; border-collapse: collapse; }
              th, td { padding: 8px; border: 1px solid #ccc; text-align: center; }
              th { background: #4facfe; color: white; }
            </style>
          </head>
          <body>
            <h2 style="text-align:center;">Player Data for ${game}</h2>
            <table>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Score</th><th>Stars</th></tr>
              ${players.map(p => `
                <tr>
                  <td>${p.name || '-'}</td>
                  <td>${p.email || '-'}</td>
                  <td>${p.phone || '-'}</td>
                  <td>${p.score || 0}</td>
                  <td>${p.stars || 0}</td>
                </tr>`).join('')}
            </table>
          </body>
        </html>
      `);
    } catch (err) {
      console.log(err);
      res.status(500).send('Server Error');
    }
  });
  
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
