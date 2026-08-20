import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: 'OAuth2',
        user: '',
        clientId: '',
        clientSecret: '',
        refreshToken: ''
    }
});

export default transporter;
