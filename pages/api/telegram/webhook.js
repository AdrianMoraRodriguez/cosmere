import { supabase } from '../../../lib/supabase';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const DM_TELEGRAM_ID = process.env.DM_TELEGRAM_ID;

// Almacenar temporalmente (en producción usar base de datos)
let telegramUsers = {};

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
    console.log('Update recibido:', update);

    // Manejar mensajes normales
    if (update.message) {
      const { chat, from, text } = update.message;
      const chatId = chat.id;
      const userId = from.id;
      const username = from.username;

      // Si el DM envía un mensaje que empieza con /reply_
      if (userId.toString() === DM_TELEGRAM_ID && text.startsWith('/reply_')) {
  const parts = text.split('\n');
  const firstLine = parts[0]; // /reply_Nico
  const responseText = parts.slice(1).join('\n'); // El mensaje

  const playerUsername = firstLine.replace('/reply_', '').trim();

  console.log('DEBUG - Reply detectado:');
  console.log('First line:', firstLine);
  console.log('Player username:', playerUsername);
  console.log('Response text:', responseText);
  console.log('DM_TELEGRAM_ID:', DM_TELEGRAM_ID);
  console.log('userId:', userId);

  if (!responseText.trim()) {
    await sendTelegramMessage(chatId, '⚠️ Escribe el mensaje después de /reply_username\n\nEjemplo:\n/reply_Nico\nTu respuesta aquí');
    return;
  }

  try {
    // Insertar en Supabase
    const { data, error } = await supabase
      .from('dm_messages')
      .insert([{
        sender_username: 'DM',
        recipient_username: playerUsername,
        message: responseText.trim()
      }]);

    console.log('Insert result:', { data, error });

    if (error) {
      console.error('Error saving message:', error);
      await sendTelegramMessage(chatId, `❌ Error al guardar: ${error.message}`);
      return;
    }

    // Notificar al jugador por Telegram
    try {
      const { data: userReg, error: userError } = await supabase
        .from('telegram_users')
        .select('telegram_id')
        .eq('username', playerUsername)
        .single();

      console.log('User lookup:', { userReg, userError });

      if (userReg?.telegram_id) {
        await sendTelegramMessage(
          userReg.telegram_id,
          `👑 <b>Respuesta del DM</b>\n\n${responseText.trim()}`
        );
      }
    } catch (err) {
      console.error('Error notifying player:', err);
    }

    await sendTelegramMessage(chatId, `✅ Mensaje enviado a ${playerUsername}`);
  } catch (err) {
    console.error('Exception:', err);
    await sendTelegramMessage(chatId, `❌ Error: ${err.message}`);
  }
}
      
      // Si un jugador escribe /register [username]
else if (text.startsWith('/register ')) {
  const playerUsername = text.replace('/register ', '').trim();
  
  // Guardar en la tabla de Supabase
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
      `✅ Registrado como <b>${playerUsername}</b>\n\nAhora puedes recibir mensajes de otros jugadores y del DM aquí.`
    );
  } else {
    await sendTelegramMessage(chatId, '❌ Error al registrar');
  }
}
      
      // Si es un jugador enviando un mensaje normal
      else if (!text.startsWith('/')) {
        // Encontrar qué jugador es por su ID
        const playerUsername = Object.entries(telegramUsers).find(
          ([_, id]) => id.toString() === userId.toString()
        )?.[0];

        if (playerUsername) {
          // Guardar en Supabase
          const { error } = await supabase
            .from('dm_messages')
            .insert({
              sender_username: playerUsername,
              recipient_username: 'DM',
              message: text
            });

          if (!error) {
            // Notificar al DM
            await sendTelegramMessage(
              DM_TELEGRAM_ID,
              `📬 <b>Nuevo mensaje de ${playerUsername}</b>\n\n<i>${text}</i>\n\nResponde con:\n/reply_${playerUsername}\nTu respuesta aquí`
            );
            
            await sendTelegramMessage(chatId, '✅ Mensaje enviado al DM');
          }
        } else {
          await sendTelegramMessage(
            chatId,
            '⚠️ Primero regístrate:\n/register [tu_username]'
          );
        }
      }
    }

    // Manejar comandos
    if (update.message?.text?.startsWith('/')) {
      const { from, text, chat } = update.message;
      const command = text.split(' ')[0];

      if (command === '/start') {
        const startText = `
👑 <b>Bot de Mensajería - Wiki del Cosmere</b>

<b>¿Eres jugador o DM?</b>

<b>Si eres JUGADOR:</b>
1. /register [tu_username]
2. Escribe aquí tus mensajes

<b>Si eres DM:</b>
Recibirás notificaciones de mensajes nuevos aquí`;

        await sendTelegramMessage(from.id, startText);
      }

      if (command === '/help') {
        const helpText = `
<b>Cómo usar:</b>

<b>JUGADORES:</b>
/register [username] - Regístrate
Luego escribe mensajes aquí

<b>DM:</b>
Recibirás notificaciones
/reply_username [mensaje] - Responder`;

        await sendTelegramMessage(from.id, helpText);
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(200).json({ ok: true }); // Devolver 200 igual para no reintentar
  }
}