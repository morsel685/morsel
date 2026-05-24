# 📧 Email Verification Setup Guide

This Restaurant POS System now includes email verification for new employee registrations. Follow this guide to configure email sending.

## ✨ Features Added

- ✅ Email verification required for new employee registrations
- ✅ Beautiful HTML email templates
- ✅ 24-hour verification token expiry
- ✅ Automatic welcome email after verification
- ✅ Frontend verification page with success/error states
- ✅ Prevention of login for unverified accounts

## 🔧 Email Configuration

### Option 1: Using Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Create an App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Generate the password (it will be a 16-character code)

3. **Update your `.env` file** in `pos-backend`:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-gmail-address@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   FRONTEND_URL=http://localhost:5173
   RESTAURANT_NAME=Restro POS
   ```

### Option 2: Using Other Email Services

For other email providers (Outlook, Yahoo, custom SMTP), update these settings:

```env
EMAIL_SERVICE=outlook  # or 'yahoo', 'hotmail', etc.
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-email-password
FRONTEND_URL=http://localhost:5173
RESTAURANT_NAME=Your Restaurant Name
```

For custom SMTP, you'll need to modify `config/emailService.js` to use SMTP configuration instead of service name.

## 🚀 How It Works

### Registration Flow:

1. **Employee fills registration form** → submits data
2. **Backend creates user account** with `isEmailVerified: false`
3. **System generates unique verification token** (valid for 24 hours)
4. **Verification email sent** to employee's email address
5. **Employee clicks verification link** in email
6. **Frontend verification page** validates the token
7. **Backend marks email as verified** (`isEmailVerified: true`)
8. **Welcome email sent** to confirm activation
9. **Employee can now login** to the system

### Email Templates:

#### Verification Email:
- Professional design with restaurant branding
- Clear call-to-action button
- Alternative link for manual copy-paste
- Expiry warning (24 hours)
- Security notice

#### Welcome Email:
- Congratulations message
- Account details summary
- Direct login link
- Role confirmation

## 🧪 Testing the Feature

### 1. Start the Servers:

```bash
# Backend
cd pos-backend
npm run dev

# Frontend (in another terminal)
cd pos-frontend
npm run dev
```

### 2. Test Registration:

1. Go to http://localhost:5173/auth
2. Click "Sign up"
3. Fill in the registration form with a **real email address**
4. Submit the form
5. Check your email inbox for the verification email
6. Click the "Verify Email Address" button in the email
7. You'll be redirected to the verification success page
8. After 3 seconds, you'll be redirected to login
9. Login with your credentials

### 3. Test Failed Login (Before Verification):

1. Try to login before clicking the verification link
2. You should see an error: "Please verify your email before logging in"

## 🛠️ Troubleshooting

### Email Not Sending?

1. **Check .env configuration**:
   - Make sure EMAIL_USER and EMAIL_PASSWORD are correct
   - For Gmail, ensure you're using App Password, not regular password

2. **Check console logs**:
   - Backend will log: `✅ Verification email sent:` on success
   - Or `❌ Error sending verification email:` on failure

3. **Check spam folder**:
   - Verification emails might land in spam initially

4. **Test email connection**:
   ```javascript
   // Add this to test your email config
   const { sendVerificationEmail } = require('./config/emailService');
   sendVerificationEmail('test@example.com', 'test-token-123', 'Test User');
   ```

### Verification Link Not Working?

1. **Check token expiry**: Tokens expire after 24 hours
2. **Check FRONTEND_URL**: Make sure it matches your frontend URL
3. **Check browser console**: Look for CORS or network errors

### Still Having Issues?

- Check that nodemon restarted after env changes
- Verify MongoDB is running
- Check all environment variables are set
- Review backend logs for specific error messages

## 📝 API Endpoints

### POST /api/user/register
Registers a new user and sends verification email.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123",
  "role": "Waiter"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email to verify your account.",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Waiter",
    "requiresVerification": true
  }
}
```

### GET /api/user/verify-email?token=YOUR_TOKEN
Verifies email using the token from the email link.

**Response (Success):**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now log in.",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Waiter"
  }
}
```

### POST /api/user/login
Login endpoint (now checks email verification).

**Error (Unverified Email):**
```json
{
  "message": "Please verify your email before logging in. Check your inbox for the verification link."
}
```

## 🎨 Customization

### Change Email Templates:

Edit `pos-backend/config/emailService.js`:
- Modify HTML templates in `sendVerificationEmail()` and `sendWelcomeEmail()`
- Update colors, text, styling as needed

### Change Token Expiry:

Edit `pos-backend/controllers/userController.js`:
```javascript
// Change 24 hours to whatever you need
const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
```

### Change Email Service:

Edit `pos-backend/.env`:
```env
# Use different service
EMAIL_SERVICE=outlook
# or yahoo, hotmail, etc.
```

## 🔒 Security Notes

- Verification tokens are randomly generated 32-byte hex strings
- Tokens are single-use and expire after 24 hours
- Unverified users cannot log in to the system
- Passwords are hashed before storage (existing feature)
- Email addresses are validated for proper format

## 📱 For Production Deployment

Before deploying to production:

1. **Use a professional email service** (SendGrid, Mailgun, AWS SES)
2. **Update FRONTEND_URL** to your production domain
3. **Use secure environment variables** (not committed to git)
4. **Enable email logging** for debugging
5. **Set up email monitoring** to track delivery rates
6. **Configure proper error handling** and notifications

## ✅ Done!

Your Restaurant POS System now has a professional email verification system. New employees must verify their email addresses before they can access the system.

For questions or issues, check the troubleshooting section above or review the code comments in:
- `pos-backend/config/emailService.js`
- `pos-backend/controllers/userController.js`
- `pos-frontend/src/pages/VerifyEmail.jsx`
