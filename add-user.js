const bcrypt = require('bcryptjs');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Intentar leer usuarios existentes
let users = {};
try {
  const loginContent = fs.readFileSync('pages/api/login.js', 'utf8');
  const match = loginContent.match(/const USERS = ({[\s\S]*?});/);
  if (match) {
    users = eval('(' + match[1] + ')');
    console.log('✓ Usuarios existentes cargados:', Object.keys(users).join(', '));
  }
} catch (err) {
  console.log('⚠ No se encontraron usuarios previos, empezando desde cero');
}

function askUser() {
  rl.question('\n¿Nombre de usuario? (deja vacío para terminar): ', (username) => {
    if (!username) {
      console.log('\n=========================');
      console.log('CÓDIGO PARA pages/api/login.js:');
      console.log('=========================\n');
      console.log('const USERS = ' + JSON.stringify(users, null, 2) + ';');
      console.log('\n=========================');
      console.log(`\nTotal usuarios: ${Object.keys(users).length}`);
      console.log('Usuarios:', Object.keys(users).join(', '));
      console.log('\n=========================\n');
      rl.close();
      return;
    }

    if (users[username]) {
      rl.question(`⚠️  El usuario "${username}" ya existe. ¿Sobreescribir? (s/n): `, (confirm) => {
        if (confirm.toLowerCase() !== 's') {
          console.log('Cancelado.');
          askUser();
          return;
        }
        createUser(username);
      });
    } else {
      createUser(username);
    }
  });
}

function createUser(username) {
  rl.question('¿Contraseña?: ', (password) => {
    rl.question('¿Rol? (admin/player): ', (role) => {
      const hash = bcrypt.hashSync(password, 10);
      users[username] = {
        username: username,
        passwordHash: hash,
        role: role || 'player'
      };
      console.log(`✓ Usuario ${username} agregado/actualizado`);
      askUser();
    });
  });
}

console.log('=========================');
console.log('GENERADOR DE USUARIOS');
console.log('(preserva usuarios existentes)');
console.log('=========================');
askUser();