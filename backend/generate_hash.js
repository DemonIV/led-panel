const bcrypt = require('bcryptjs');

async function generateHashes() {
  const password = 'password';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
}

generateHashes();