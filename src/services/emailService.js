const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    
    this.transporter = nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 587,
      auth: {
        user: 'f08ba76e2bc1dd',
        pass: 'c8247664a771ff'
      }
    });
  }

  async sendTokenEmail(email, token, sessionId) {
    try {
      const mailOptions = {
        from: '"Billetera Virtual" <wallet@wallet.com>',
        to: email,
        subject: 'Token de confirmación de pago',
        text: `Tu token de confirmación es: ${token}\nID de sesión: ${sessionId}`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Confirmación de Pago</h2>
            <p>Por favor usa el siguiente token para confirmar tu pago:</p>
            <p style="font-size: 24px; font-weight: bold;">${token}</p>
            <p>ID de sesión: <code>${sessionId}</code></p>
            <p>Este token expirará en 15 minutos.</p>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);
      console.log('Token : %s', token);
      console.log('Session ID : %s', sessionId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}

module.exports = new EmailService();