export const renderTemplate = (templateName, data) => {
  if (templateName === "forgotPassword") {
    return `
      <div style="font-family: Arial, sans-serif;">
        <h2>Hello ${data.name || "User"},</h2>
        <p>You requested a password reset. Use the OTP below to reset your password:</p>
        <h3 style="color:#007bff;">${data.otp}</h3>
        <p>This OTP will expire in 10 minutes.</p>
        <p>Do not share this code with anyone.</p>
        <br/>
        <p>Best regards,<br>SECE Admission Portal Team</p>
      </div>
    `;
  }
};
