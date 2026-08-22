import transporter from "../config/nodemailer.js";


async function sendMail({to, subject, html}) {
    const mailOptions = {
        to,
        subject,
        html
    };

    const mailInfo = await transporter.sendMail(mailOptions);

    console.log(mailInfo);
}

export default sendMail;
