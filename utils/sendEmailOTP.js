import nodemailer from "nodemailer";

const sendEmailOTP = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // "smtp.gmail.com"
      port: Number(process.env.SMTP_PORT), // 465
      secure: true, // true for port 465, false for 587
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"YouTube Clone OTP" <${process.env.SMTP_MAIL}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("SMTP Email send error:", error);
    throw error;
  }
};

export default sendEmailOTP;
