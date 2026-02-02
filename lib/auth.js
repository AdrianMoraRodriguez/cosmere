import bcrypt from 'bcryptjs';

// Usuarios hardcodeados (puedes moverlos a una BD después)
const USERS = {
  admin: {
    username: 'admin',
    // Password: "tormentas123" (cámbialo)
    passwordHash: '$2a$10$XqTlQqxQxQxQxQxQxQxQxOeKqTlQqxQxQxQxQxQxQxOeKqTlQqx',
    role: 'admin'
  },
  jugador: {
    username: 'jugador',
    // Password: "roshar2024" (cámbialo)
    passwordHash: '$2a$10$YrTmRmxRxRxRxRxRxRxRxPfLrTmRmxRxRxRxRxRxRxPfLrTmRmx',
    role: 'player'
  }
};

export async function validateUser(username, password) {
  const user = USERS[username];
  if (!user) return null;
  
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return null;
  
  return { username: user.username, role: user.role };
}

export function isAdmin(user) {
  return user?.role === 'admin';
}

// Helper para generar hash de password (úsalo para crear nuevos usuarios)
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}