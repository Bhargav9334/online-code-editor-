const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const SNIPPETS_DIR = path.join(__dirname, 'snippets');
if (!fs.existsSync(SNIPPETS_DIR)) fs.mkdirSync(SNIPPETS_DIR);

app.post('/save', (req, res) => {
  const { html, css, js } = req.body;
  const id = uuidv4();
  const data = { html, css, js };
  fs.writeFileSync(path.join(SNIPPETS_DIR, `${id}.json`), JSON.stringify(data));
  res.send({ id });
});

app.get('/load/:id', (req, res) => {
  const file = path.join(SNIPPETS_DIR, `${req.params.id}.json`);
  if (fs.existsSync(file)) {
    const data = fs.readFileSync(file);
    res.json(JSON.parse(data));
  } else {
    res.status(404).send({ error: 'Snippet not found' });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
