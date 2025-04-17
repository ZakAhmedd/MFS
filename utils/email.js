const nodemailer = require('nodemailer');

// Create a transporter using your email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-email-password'
  }
});

// Function to send the email
async function sendVerificationEmail(email, code) {
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: 'Email Verification Code',
    text: `Your verification code is: ${code}`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent');
  } catch (err) {
    console.error('Error sending verification email', err);
  }
}

module.exports = sendVerificationEmail;
