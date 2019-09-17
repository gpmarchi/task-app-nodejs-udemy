const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: process.env.SEND_EMAIL_ACCOUNT,
    subject: "Thanks for joining in!",
    text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
  });
};

const sendCancelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: process.env.SEND_EMAIL_ACCOUNT,
    subject: "We are sorry to see you leave! =(",
    text:
      `${name}, we are so sorry to see you go! Please, if you are willing, take ` +
      "a moment to tell us what we could have made different to keep you as our " +
      "most valued customer."
  });
};

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail
};
