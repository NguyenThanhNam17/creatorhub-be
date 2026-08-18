import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

    let transporter = nodemailer.createTransport({
      // service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "thanhnamwa2004@gmail.com", // Địa chỉ email của bạn
        pass: "yrhttqgbqhqxpzqo", // Mật khẩu email của bạn
      },
    });

export const sendMail = async (
  to: string,
  subject: string,
  htmlContent: string
) => {
  try {
     // Định nghĩa các thông tin email
    let mailOptions = {
      from: "thanhnamwa2004@gmail.com", // Địa chỉ email người gửi
      to: to, // Địa chỉ email người nhận
      subject: subject, // Tiêu đề email
      html: htmlContent,
    };
    
    // Gửi email
    let info = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(" Lỗi gửi email:", error);
    throw error;
  }
};
