const nodemailer = require("nodemailer");
const config = require("./config");

let activeTransporter = null;
let isEthereal = false;

const getTransporter = async () => {
    if (activeTransporter) return activeTransporter;

    const hasGmailCreds = config.emailUser && config.emailPassword && 
                          !config.emailUser.includes('your_') && 
                          !config.emailPassword.includes('your_');

    if (hasGmailCreds) {
        try {
            activeTransporter = nodemailer.createTransport({
                service: config.emailService || 'gmail',
                auth: {
                    user: config.emailUser,
                    pass: config.emailPassword
                }
            });
            await activeTransporter.verify();
            isEthereal = false;
            return activeTransporter;
        } catch (error) {
            console.warn("⚠️ Configured email transporter failed verification. Falling back to Ethereal Email...");
        }
    }

    try {
        console.log("ℹ️ Creating temporary Ethereal SMTP test account...");
        const testAccount = await nodemailer.createTestAccount();
        activeTransporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        isEthereal = true;
        console.log(`✅ Temporary Ethereal SMTP account created: ${testAccount.user}`);
        return activeTransporter;
    } catch (err) {
        console.error("❌ Failed to create Ethereal SMTP account:", err);
        throw err;
    }
};

const sendMailWrapper = async (mailOptions) => {
    try {
        const transporterInstance = await getTransporter();
        if (isEthereal && transporterInstance.options.auth) {
            mailOptions.from = `"${config.restaurantName || 'Restro POS'}" <${transporterInstance.options.auth.user}>`;
        }
        
        const info = await transporterInstance.sendMail(mailOptions);
        
        if (isEthereal) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            console.log("\n=======================================================");
            console.log("📨 ETHEREAL EMAIL SENT (DEVELOPMENT FALLBACK)");
            console.log(`To: ${mailOptions.to}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log(`Preview Link: ${previewUrl}`);
            console.log("=======================================================\n");
        }
        return info;
    } catch (error) {
        if (!isEthereal && (error.code === 'EAUTH' || error.message.includes('Username and Password not accepted'))) {
            console.warn("⚠️ Email authentication failed. Retrying with Ethereal Email fallback...");
            activeTransporter = null;
            const fallbackTransporter = await getTransporter();
            if (isEthereal && fallbackTransporter.options.auth) {
                mailOptions.from = `"${config.restaurantName || 'Restro POS'}" <${fallbackTransporter.options.auth.user}>`;
            }
            const info = await fallbackTransporter.sendMail(mailOptions);
            const previewUrl = nodemailer.getTestMessageUrl(info);
            console.log("\n=======================================================");
            console.log("📨 ETHEREAL EMAIL SENT (DEVELOPMENT FALLBACK)");
            console.log(`To: ${mailOptions.to}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log(`Preview Link: ${previewUrl}`);
            console.log("=======================================================\n");
            return info;
        }
        throw error;
    }
};

// Send verification/approval email to ADMIN (not employee)
const sendVerificationEmail = async (employeeEmail, verificationToken, employeeName, employeeRole, employeePhone) => {
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;

    const mailOptions = {
        from: `"${config.restaurantName || 'Restro POS'}" <${config.emailUser}>`,
        to: config.adminEmail || config.emailUser, // Send to admin, not employee
        subject: `New Employee Registration Pending Approval - ${employeeName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                             color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #10b981; 
                             color: white; text-decoration: none; border-radius: 5px; 
                             font-weight: bold; margin: 20px 0; }
                    .button:hover { background: #059669; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .info-box { background: white; border-left: 4px solid #f59e0b; 
                               padding: 15px; margin: 15px 0; border-radius: 5px; }
                    .employee-details { background: #e0f2fe; padding: 15px; border-radius: 5px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>👤 New Employee Registration</h1>
                    </div>
                    <div class="content">
                        <h2>Hello Admin,</h2>
                        <p>A new employee has registered and is waiting for your approval to access the ${config.restaurantName || 'Restaurant'} POS System.</p>
                        
                        <div class="employee-details">
                            <h3>📋 Employee Details:</h3>
                            <p><strong>Name:</strong> ${employeeName}</p>
                            <p><strong>Email:</strong> ${employeeEmail}</p>
                            <p><strong>Phone:</strong> ${employeePhone}</p>
                            <p><strong>Role:</strong> ${employeeRole}</p>
                            <p><strong>Registration Date:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        
                        <div class="info-box">
                            <p><strong>⚡ Action Required:</strong> Please review the employee details above. If you approve this registration, click the button below to activate their account.</p>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="${verificationUrl}" class="button">✅ Approve & Activate Account</a>
                        </div>
                        
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="background: #e9e9e9; padding: 10px; border-radius: 5px; word-break: break-all;">
                            ${verificationUrl}
                        </p>
                        
                        <p><strong>What happens after approval?</strong></p>
                        <ul>
                            <li>The employee will be able to log in to the system</li>
                            <li>They will receive a welcome email notification</li>
                            <li>Their account will be fully activated</li>
                        </ul>
                        
                        <p style="color: #dc2626; margin-top: 20px;">
                            <strong>⚠️ Note:</strong> This approval link will expire in 24 hours. 
                            If you don't recognize this employee or suspect unauthorized registration, please ignore this email and delete the account from the admin panel.
                        </p>
                        
                        <p>Best regards,<br>
                        <strong>Restro POS System</strong></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated admin notification. Do not reply to this email.</p>
                        <p>&copy; ${new Date().getFullYear()} ${config.restaurantName || 'Restro POS'}. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await sendMailWrapper(mailOptions);
        console.log('✅ Admin approval email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending admin approval email:', error);
        throw error;
    }
};

// Send welcome email after verification
const sendWelcomeEmail = async (email, name, role) => {
    const mailOptions = {
        from: `"${config.restaurantName || 'Restro POS'}" <${config.emailUser}>`,
        to: email,
        subject: 'Account Verified - Welcome to Restro POS!',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                             color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #fbbf24; 
                             color: #1a1a1a; text-decoration: none; border-radius: 5px; 
                             font-weight: bold; margin: 20px 0; }
                    .info-box { background: white; border: 2px solid #10b981; padding: 15px; 
                               border-radius: 5px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Email Verified Successfully!</h1>
                    </div>
                    <div class="content">
                        <h2>Congratulations ${name}! 🎉</h2>
                        <p>Your email has been verified and your account is now active.</p>
                        
                        <div class="info-box">
                            <h3>Your Account Details:</h3>
                            <p><strong>Role:</strong> ${role}</p>
                            <p><strong>Email:</strong> ${email}</p>
                        </div>
                        
                        <p>You can now log in to the Restro POS system using your credentials.</p>
                        
                        <div style="text-align: center;">
                            <a href="${config.frontendUrl}/auth" class="button">Login Now</a>
                        </div>
                        
                        <p>If you have any questions or need assistance, please contact your administrator.</p>
                        
                        <p>Happy serving!<br>
                        <strong>Restro POS Team</strong></p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await sendMailWrapper(mailOptions);
        console.log('✅ Welcome email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending welcome email:', error);
        // Don't throw error for welcome email - verification already succeeded
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendVerificationEmail,
    sendWelcomeEmail
};
