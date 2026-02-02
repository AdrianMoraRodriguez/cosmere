const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const users = {};

function askUser() {
  rl.question('\n¿Nombre de usuario? (deja vacío para terminar): ', (username) => {
    if (!username) {
      console.log('\n=========================');
      console.log('CÓDIGO PARA pages/api/login.js:');
      console.log('=========================\n');
      console.log('const USERS = ' + JSON.stringify(users, null, 2) + ';');
      console.log('\n=========================\n');
      rl.close();
      return;
    }

    rl.question('¿Contraseña?: ', (password) => {
      rl.question('¿Rol? (admin/player): ', (role) => {
        const hash = bcrypt.hashSync(password, 10);
        
        users[username] = {
          username: username,
          passwordHash: hash,
          role: role || 'player'
        };

        console.log(`✓ Usuario ${username} agregado`);
        askUser();
      });
    });
  });
}

console.log('=========================');
console.log('GENERADOR DE USUARIOS');
console.log('=========================');
askUser();