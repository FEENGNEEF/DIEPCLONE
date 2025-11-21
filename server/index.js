import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('client'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
