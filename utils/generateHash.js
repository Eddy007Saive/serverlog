const bcrypt = require('bcrypt');

// Utilitaire pour générer des mots de passe hashés
// À exécuter en ligne de commande: node utils/generateHash.js

const generatePasswordHash = async (password) => {
  try {
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`Mot de passe: ${password}`);
    console.log(`Hash: ${hash}`);
    return hash;
  } catch (error) {
    console.error('Erreur lors du hashage:', error);
  }
};

// Fonction pour tester si un mot de passe correspond à un hash
const testPassword = async (password, hash) => {
  try {
    const match = await bcrypt.compare(password, hash);
    console.log(`Le mot de passe "${password}" correspond au hash: ${match}`);
    return match;
  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
};

// Si le fichier est exécuté directement
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node utils/generateHash.js <password>           # Générer un hash');
    console.log('  node utils/generateHash.js <password> <hash>    # Tester un hash');
    process.exit(1);
  }

  if (args.length === 1) {
    // Générer un hash
    generatePasswordHash(args[0]);
  } else if (args.length === 2) {
    // Tester un hash
    testPassword(args[0], args[1]);
  }
}

module.exports = {
  generatePasswordHash,
  testPassword
};