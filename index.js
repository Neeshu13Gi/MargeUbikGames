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

// Admin Dashboard
app.get('/admin', async (req, res) => {
  const password = req.query.password;
  const game = req.query.game || 'all';

  if (password !== 'Ubik@123') return res.status(401).send('Unauthorized');

  const fetchData = async (model, gameName) => {
    const data = await model.find();
    return data.map(d => ({ ...d.toObject(), gameName }));
  };

  let allData = [];

  if (game === 'game1' || game === 'all') allData.push(...await fetchData(Player1, 'game1'));
  if (game === 'game2' || game === 'all') allData.push(...await fetchData(Player2, 'game2'));
  if (game === 'game3' || game === 'all') allData.push(...await fetchData(Player3, 'game3'));

  res.send(`
    <html><head><title>Admin</title>
    <style>
      body { font-family: Arial; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 10px; }
      button { margin: 4px; padding: 8px 12px; }
    </style></head>
    <body>
      <h1>Admin Dashboard</h1>
      <button onclick="filter('all')">All</button>
      <button onclick="filter('game1')">Game1</button>
      <button onclick="filter('game2')">Game2</button>
      <button onclick="filter('game3')">Game3</button>

      <table>
        <tr><th>Name</th><th>Email</th><th>Phone</th><th>Score</th><th>Stars</th><th>Game</th></tr>
        ${allData.map(p => `
          <tr>
            <td>${p.name}</td><td>${p.email}</td><td>${p.phone}</td>
            <td>${p.score}</td><td>${p.stars}</td><td>${p.gameName}</td>
          </tr>`).join('')}
      </table>

      <script>
        function filter(game) {
          const pwd = new URLSearchParams(window.location.search).get('password');
          window.location.href = '/admin?password=' + pwd + '&game=' + game;
        }
      </script>
    </body></html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
