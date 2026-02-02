import bcrypt from 'bcryptjs';

// Usuarios hardcodeados - CAMBIA LAS CONTRASEÑAS

const USERS = {
  admin: {
    username: "DM",
    passwordHash: "$2b$10$/c32sIUj8YFG78wLqJg3UuQAlXAaYVjyqpLiA0/i.yPoA5dkDj4eG",
    role: "admin"
  },
  Salva: {
    username: "Salva",
    passwordHash: "$2b$10$X2ChYmpGXzl0joZLWvnNqeF2kGigwLX8ZiOX/rd/wACE/Q5Pmi6jm",
    role: "player"
  },
  Aitor: {
    username: "Aitor",
    passwordHash: "$2b$10$T1spcW3y3bogeTAQd0Di.ufvxl1cmxtqm79.pAtmwKLTnWg1nuVSa",
    role: "player"
  },
  Nico: {
    username: "Nico",
    passwordHash: "$2b$10$XTbcz2iPjpXx4G2gUYibbe1IYyF8.SZ395AH/Il28hRm1.9wsdaqG",
    role: "player"
  },
  Dani: {
    username: "Dani",
    passwordHash: "$2b$10$x6Pc1OHRWfZk2eoeNDrQXeFnu8I4YZzb6xAoJh6x6gFwnFAifsA4a",
    role: "player"
  },
  JJ: {
    username: "JJ",
    passwordHash: "$2b$10$Norrf6wBGyzmUuaGBJseg.2BxRt1HAeePmUGglHlFqbpWAyXyoxF2",
    role: "player"
  },
  Iker: {
    username: "Iker",
    passwordHash: "$2b$10$j.XzUiShlsjlGvFy/Pcywu7MobONGGa1EGwy/0cIgkqQVLFJNa5dO",
    role: "player"
  },
  Jose: {
    username: "Jose",
    passwordHash: "$2b$10$AqHn456doyMiuzPheqRYjeFS0ZtiCzxk3TpXA4S1bTH4FXO7VWTUa",
    role: "player"
  },
  Daniela: {
    username: "Daniela",
    passwordHash: "$2b$10$HG5YBNIE/j8P98qn7KTxSuphiWQeCrXU.jZgGHmoEfC/ZGFSQpozS",
    role: "player"
  },
  Val: {
    username: "Val",
    passwordHash: "$2b$10$rqkTqQFq8uClzI/41bEFpOxKe8kNmuHNrYjY8lgRehbLIoGz1WO6u",
    role: "player"
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body;

  const user = USERS[username];
  if (!user) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  res.status(200).json({ 
    user: { 
      username: user.username, 
      role: user.role 
    } 
  });
}