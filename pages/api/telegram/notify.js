import { supabase } from '../../../lib/supabase';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DM_TELEGRAM_ID = process.env.DM_TELEGRAM_ID;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Mapeo de usuarios registrados en Telegram (se actualiza cuando usan /register)
let telegramUsers = {};

// Función para enviar mensaje
async function sendTelegramMessage(chatId, text) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
    
    return await response.json();
  } catch (err) {
    console.error('Error sending Telegram message:', err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!TELEGRAM_BOT_TOKEN || !DM_TELEGRAM_ID) {
    return res.status(200).json({ ok: true, skipped: 'Telegram is not configured' });
  }

  const { senderUsername, recipientUsername, message } = req.body;

  if (!senderUsername || !recipientUsername || !message) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    // Si el destinatario es el DM
    if (recipientUsername === 'DM') {
      await sendTelegramMessage(
        DM_TELEGRAM_ID,
        `📬 <b>Nuevo mensaje de ${senderUsername}</b>\n\n<i>${message}</i>\n\nResponde con:\n/reply_${senderUsername}\nTu respuesta`
      );
    } 
    // Si el destinatario es un jugador
    else {
      // Buscar el ID de Telegram del jugador en la base de datos
      // Para esto necesitamos una tabla de usuarios registrados
      const { data: userRegistration } = await supabase
        .from('telegram_users')
        .select('telegram_id')
        .eq('username', recipientUsername)
        .single();

      if (userRegistration?.telegram_id) {
        await sendTelegramMessage(
          userRegistration.telegram_id,
          `💬 <b>Nuevo mensaje de ${senderUsername}</b>\n\n<i>${message}</i>`
        );
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(200).json({ ok: true }); // Devolver 200 igual para no fallar
  }
}
