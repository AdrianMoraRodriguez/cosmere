import { supabase } from '../../../lib/supabase';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const DM_TELEGRAM_ID = process.env.DM_TELEGRAM_ID;

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

  try {
    const update = req.body;
    console.log('Update recibido:', update.message?.text || 'no text');

    if (!update.message || !update.message.text) {
      return res.status(200).json({ ok: true });
    }

    const { chat, from, text } = update.message;
    const chatId = chat.id;
    const userId = from.id;

    // ============ COMANDOS DEL DM ============
    if (userId.toString() === DM_TELEGRAM_ID) {
      // /reply_username
      if (text.startsWith('/reply_')) {
        const parts = text.split('\n');
        const firstLine = parts[0];
        const responseText = parts.slice(1).join('\n').trim();
        const playerUsername = firstLine.replace('/reply_', '').trim();

        if (!responseText) {
          await sendTelegramMessage(
            chatId,
            '⚠️ Formato incorrecto.\n\nUsa:\n/reply_NombreUsuario\nTu mensaje aquí'
          );
          return res.status(200).json({ ok: true });
        }

        try {
          const { error } = await supabase
            .from('dm_messages')
            .insert([{
              sender_username: 'DM',
              recipient_username: playerUsername,
              message: responseText
            }]);

          if (error) {
            await sendTelegramMessage(chatId, `❌ Error: ${error.message}`);
            return res.status(200).json({ ok: true });
          }

          // Notificar al jugador
          try {
            const { data: userReg } = await supabase
              .from('telegram_users')
              .select('telegram_id')
              .eq('username', playerUsername)
              .single();

            if (userReg?.telegram_id) {
              await sendTelegramMessage(
                userReg.telegram_id,
                `👑 <b>Respuesta del DM</b>\n\n${responseText}`
              );
            }
          } catch (err) {
            console.error('Error notifying player:', err);
          }

          await sendTelegramMessage(chatId, `✅ Mensaje enviado a ${playerUsername}`);
          return res.status(200).json({ ok: true });
        } catch (err) {
          await sendTelegramMessage(chatId, `❌ Error: ${err.message}`);
          return res.status(200).json({ ok: true });
        }
      }
    }

    // ============ COMANDOS DE JUGADORES ============
    if (text.startsWith('/register ')) {
      const playerUsername = text.replace('/register ', '').trim();
      
      const { error } = await supabase
        .from('telegram_users')
        .upsert({
          username: playerUsername,
          telegram_id: userId
        }, {
          onConflict: 'username'
        });

      if (!error) {
        await sendTelegramMessage(
          chatId,
          `✅ Registrado como <b>${playerUsername}</b>\n\nAhora puedes recibir mensajes aquí.`
        );
      } else {
        await sendTelegramMessage(chatId, '❌ Error al registrar');
      }
      return res.status(200).json({ ok: true });
    }

    if (text === '/start') {
      const startText = `
👑 <b>Bot de Mensajería - Wiki del Cosmere</b>

<b>¿Eres jugador o DM?</b>

<b>Si eres JUGADOR:</b>
1. /register [tu_username]
2. Escribe aquí tus mensajes

<b>Si eres DM:</b>
Recibirás notificaciones de mensajes nuevos aquí`;

      await sendTelegramMessage(chatId, startText);
      return res.status(200).json({ ok: true });
    }

    if (text === '/help') {
      const helpText = `
<b>Cómo usar:</b>

<b>JUGADORES:</b>
/register [username] - Regístrate
Luego escribe mensajes aquí

<b>DM:</b>
/reply_username [mensaje] - Responder`;

      await sendTelegramMessage(chatId, helpText);
      return res.status(200).json({ ok: true });
    }

    // ============ MENSAJES NORMALES ============
    if (!text.startsWith('/')) {
      // Buscar el usuario registrado
      const { data: userReg } = await supabase
        .from('telegram_users')
        .select('username')
        .eq('telegram_id', userId)
        .single();

      if (userReg?.username) {
        const { error } = await supabase
          .from('dm_messages')
          .insert({
            sender_username: userReg.username,
            recipient_username: 'DM',
            message: text
          });

        if (!error) {
          // Notificar al DM
          await sendTelegramMessage(
            DM_TELEGRAM_ID,
            `📬 <b>Nuevo mensaje de ${userReg.username}</b>\n\n<i>${text}</i>\n\nResponde con:\n/reply_${userReg.username}\nTu respuesta`
          );
          
          await sendTelegramMessage(chatId, '✅ Mensaje enviado al DM');
        }
      } else {
        await sendTelegramMessage(
          chatId,
          '⚠️ Primero regístrate:\n/register [tu_username]'
        );
      }
      return res.status(200).json({ ok: true });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(200).json({ ok: true });
  }
}