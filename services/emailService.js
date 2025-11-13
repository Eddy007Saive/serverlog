const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true pour le port 465 (SSL), false pour 587 (TLS)
  auth: {
    user: process.env.SMTP_USER, // adresse email
    pass: process.env.SMTP_PASS  // mot de passe ou app password
  }
});

/**
 * Envoie un e-mail de vérification de connexion
 * @param {string} to - Adresse email du destinataire
 * @param {string} code - Code de vérification à 6 chiffres
 * @param {string} username - Nom d’utilisateur
 */
async function sendVerificationEmail(to, code, username) {
  const appName = process.env.APP_NAME || 'Mon Application';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const mailOptions = {
    from: `"${appName}" <${process.env.SMTP_USER}>`,
    to,
    subject: `🔐 Code de vérification - ${appName}`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f9f9f9; padding:20px; border-radius:10px; max-width:600px; margin:auto;">
        <h2 style="color:#333;">Bonjour ${username || ''},</h2>
        <p>Vous avez tenté de vous connecter à votre compte <strong>${appName}</strong>.</p>
        <p>Voici votre code de vérification :</p>
        <h1 style="color:#4CAF50; font-size: 40px; letter-spacing: 4px;">${code}</h1>
        <p>Ce code expirera dans <strong>10 minutes</strong>.</p>
        <p style="font-size:12px; color:#666;">Si vous n'avez pas demandé ce code, ignorez simplement cet e-mail.</p>
        <hr/>
        <p style="font-size:12px; color:#aaa;">© ${new Date().getFullYear()} ${appName} — <a href="${frontendUrl}" style="color:#aaa;">${frontendUrl}</a></p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé à ${to} : ${info.messageId}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email :', error);
    throw new Error('Impossible d\'envoyer le code de vérification');
  }
}

module.exports = {
  sendVerificationEmail
};
