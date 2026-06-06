const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DM_TELEGRAM_ID = process.env.DM_TELEGRAM_ID;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { playerUsername, message } = req.body;

  if (!playerUsername || !message) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: DM_TELEGRAM_ID,
        text: `📬 <b>Nuevo mensaje de ${playerUsername}</b>\n\n<i>${message}</i>\n\nResponde con:\n/reply_${playerUsername}\nTu respuesta`,
        parse_mode: 'HTML'
      })
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
}