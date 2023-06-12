import nodemailer from 'nodemailer';
import debug from 'debug';

const log: debug.IDebugger = debug('app:mail');

// Create a transporter object with SMTP configuration
const sendMail = async (emails: string[], subject: string, html: string) => {
  

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Your SMTP host server
    //port: 587, // Your SMTP port
    //secure: false, // Set to true if you're using a secure connection (e.g., SSL/TLS) /Port 465
    auth: {
      user: process.env.EMAIL_ACCOUNT, // Your email address
      pass: process.env.EMAIL_PASSWORD, // Your email password
    },
  });

  for (const email of emails) {
    const options = {
      from: `"EffieKwanso🏡 Rentals"<${process.env.EMAIL_ACCOUNT}>`, // sender address
      to: email, // list of receivers
      subject, // Subject line
      html, // html body
    };
  transporter.sendMail(options, (err, info) => {
      if (err) {
        log(err);
        return;
      }
      log(info.messageId);
    });
  }
};

export default sendMail;
