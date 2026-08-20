import transporter from "../config/nodemailer.js";


async function sendMail({to, subject, html}) {
    const mailOptions = {};

    const mailInfo = await transporter.sendMail(mailOptions);

    console.log(mailInfo);
}

export default sendMail;
