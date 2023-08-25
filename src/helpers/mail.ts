import nodemailer from 'nodemailer';
import debug from 'debug';

const log: debug.IDebugger = debug('app:mail');

// Create a transporter object with SMTP configuration
const sendMail = async (
  emails: string[],
  subject: string,
  html: string,
  attachments?
) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Your SMTP host server
    port: 587, // Your SMTP port
    secure: false, // Set to true if you're using a secure connection (e.g., SSL/TLS) /Port 465
    auth: {
      user: process.env.EMAIL_ACCOUNT, // Your email address
      pass: process.env.EMAIL_PASSWORD, // Your email password
    },
  });

  const options = {
    from: `"Adakadan🏡 Propeties"<${process.env.EMAIL_ACCOUNT}>`, // sender address
    to: null, // list of receivers
    subject, // Subject line
    html, // html body
    attachments, // attachment
  };
  for (const email of emails) {
    options.to = email;
    await transporter.sendMail(options);
  }
};

export default sendMail;
