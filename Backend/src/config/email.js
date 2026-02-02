const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send email function
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Quran Academy CRM'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  // Welcome email for new team members
  teamMemberCredentials: ({ name, email, role, loginUrl, password }) => ({
    subject: 'Welcome to Quran Academy CRM - Your Account Details',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .credential-item { margin: 10px 0; }
          .credential-label { font-weight: bold; color: #667eea; }
          .credential-value { background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-left: 10px; font-family: monospace; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌙 Welcome to Quran Academy CRM</h1>
          </div>
          <div class="content">
            <h2>Assalamu Alaikum, ${name}!</h2>
            <p>Your account has been created successfully. You have been assigned the role of <strong>${role}</strong>.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials</h3>
              <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${email}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Password:</span>
                <span class="credential-value">${password}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Role:</span>
                <span class="credential-value">${role}</span>
              </div>
            </div>

            <div class="warning">
              <strong>⚠️ Important Security Notice:</strong>
              <p>Your password has been set by the administrator. Please contact your administrator to receive your password or use the password reset option on the login page.</p>
            </div>

            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Login to Your Account</a>
            </div>

            <h3>Getting Started</h3>
            <ul>
              <li>Click the button above to access the CRM system</li>
              <li>Contact your administrator to receive your password</li>
              <li>Use your email and password to login</li>
              <li>Explore your dashboard and assigned tasks</li>
            </ul>

            <p>If you have any questions or need assistance, please contact your administrator.</p>

            <p>Best regards,<br><strong>Quran Academy CRM Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Quran Academy CRM. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // Welcome email for new teachers
  teacherCredentials: ({ name, email, loginUrl, password }) => ({
    subject: 'Welcome to Quran Academy - Your Teacher Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .credential-item { margin: 10px 0; }
          .credential-label { font-weight: bold; color: #10b981; }
          .credential-value { background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-left: 10px; font-family: monospace; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 Welcome to Quran Academy</h1>
          </div>
          <div class="content">
            <h2>Assalamu Alaikum, Ustaz/Ustaza ${name}!</h2>
            <p>We are delighted to welcome you to our teaching team. Your account has been created successfully.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials</h3>
              <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${email}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Password:</span>
                <span class="credential-value">${password}</span>
              </div>
            </div>

            <div class="warning">
              <strong>⚠️ Important Security Notice:</strong>
              <p>Your password has been set by the administrator. Please contact your administrator to receive your password or use the password reset option on the login page.</p>
            </div>

            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Access Teacher Portal</a>
            </div>

            <h3>As a Teacher, You Can:</h3>
            <ul>
              <li>View and manage your class schedule</li>
              <li>Track student progress and attendance</li>
              <li>Submit lesson reports and homework</li>
              <li>Communicate with students and parents</li>
              <li>Access teaching materials and resources</li>
            </ul>

            <p>JazakAllah Khair for joining our mission to spread Quranic knowledge!</p>

            <p>Best regards,<br><strong>Quran Academy Administration</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Quran Academy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  studentCredentials: ({ name, email, loginUrl, password }) => ({
    subject: 'Welcome to Quran Academy CRM - Your Account Details',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .credential-item { margin: 10px 0; }
          .credential-label { font-weight: bold; color: #667eea; }
          .credential-value { background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-left: 10px; font-family: monospace; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌙 Welcome to Quran Academy CRM</h1>
          </div>
          <div class="content">
            <h2>Assalamu Alaikum, ${name}!</h2>
            <p>Your account has been created successfully. You have been assigned the role of <strong>Student</strong>.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials</h3>
              <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${email}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Password:</span>
                <span class="credential-value">${password}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Role:</span>
                <span class="credential-value">Student</span>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Login to Your Account</a>
            </div>

            <h3>Getting Started</h3>
            <ul>
              <li>Click the button above to access the CRM system</li>
              <li>Contact your administrator to receive your password</li>
              <li>Use your email and password to login</li>
              <li>Explore your personalized dashboard</li>
              <li>Start managing your tasks and activities</li>
            </ul>

            <div class="warning">
              <strong>⚠️ Important Security Notice:</strong>
              <p>Your password has been set by the administrator. Please contact your administrator to receive your password or use the password reset option on the login page.</p>
            </div>

            <p>JazakAllah Khair for joining our mission to spread Quranic knowledge!</p>

            <p>Best regards,<br><strong>Quran Academy Administration</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Quran Academy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
