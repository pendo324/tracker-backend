const nodemailer = require('nodemailer');
// const sendmailTransport = require('nodemailer-sendmail-transport');

const transporter = nodemailer.createTransport({
  host: 'mail.topkek.us',
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const makeActivationURL = (activationCode) => {
  return `http://${process.env.DOMAIN}:${
    process.env.HTTP_PORT
  }/activate/${activationCode}`;
};

module.exports.sendActivationEmail = (to, activationCode) => {
  const mailOptions = {
    from: 'Topkek <noreply@topkek.us>',
    to,
    subject: 'Email verification',
    text: `Please click on the link below to activate your account:\n\n ${makeActivationURL(
      activationCode
    )}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err);
    }
    console.log(`Message sent: ${info.response}`);
  });
};
