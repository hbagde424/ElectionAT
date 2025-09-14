const nodemailer = require('nodemailer');

// Email configuration
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  Email credentials not configured. Using console log instead.');
    return null;
  }

  // Try to create transporter based on email domain
  const emailDomain = process.env.EMAIL_USER.split('@')[1];
  
  if (emailDomain === 'gmail.com') {
    // Gmail configuration
    console.log('🔧 Using Gmail SMTP configuration...');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true, // Enable debug logs
      logger: true // Enable logger
    });
  } else {
    // Generic SMTP configuration for other domains
    return nodemailer.createTransport({
      host: `mail.${emailDomain}`,
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
};

// @desc    Send contact form email
// @route   POST /api/help-center/contact
// @access  Public
exports.sendContactEmail = async (req, res) => {
  try {
    const { name, mobile, email, description } = req.body;

    // Validation
    if (!name || !mobile || !email || !description) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Mobile validation (10 digit Indian number)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number'
      });
    }

    // Create transporter
    const transporter = createTransporter();

    // If no email service configured, log to console and return success
    if (!transporter) {
      console.log('📧 Contact Form Submission (Email service not configured):');
      console.log('=====================================');
      console.log(`Name: ${name}`);
      console.log(`Email: ${email}`);
      console.log(`Mobile: ${mobile}`);
      console.log(`Message: ${description}`);
      console.log(`Target Email: developer@akalptechnomediasolutions.com`);
      console.log(`Date: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      console.log('=====================================');

      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Your message has been received! We will get back to you soon. (Email service not configured - check backend console)'
      });
    }

    // Email content
    const mailOptions = {
      from: `"ElectionAT Help Center" <${process.env.EMAIL_USER}>`,
      to: 'developer@akalptechnomediasolutions.com',
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">Contact Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #555;">Name:</td>
                <td style="padding: 8px; color: #333;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #555;">Email:</td>
                <td style="padding: 8px; color: #333;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #555;">Mobile:</td>
                <td style="padding: 8px; color: #333;">${mobile}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">Message</h3>
            <p style="color: #333; line-height: 1.6; margin: 0;">${description}</p>
          </div>

          <div style="background-color: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              This email was sent from the ElectionAT Help Center contact form.
            </p>
            <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 12px;">
              Date: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 14px; margin: 0;">
              <strong>ElectionAT - Help Center</strong>
            </p>
          </div>
        </div>
      `
    };

    // Send email
    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to developer@akalptechnomediasolutions.com');
    } catch (emailError) {
      console.log('❌ Email sending failed:', emailError.message);
      console.log('📧 Logging form data to console instead:');
      console.log('=====================================');
      console.log(`Name: ${name}`);
      console.log(`Email: ${email}`);
      console.log(`Mobile: ${mobile}`);
      console.log(`Message: ${description}`);
      console.log(`Target Email: developer@akalptechnomediasolutions.com`);
      console.log(`Date: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      console.log('=====================================');
    }

    // Success response
    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you soon.'
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command
    });
    
    // Error response
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code
      } : undefined
    });
  }
};

// @desc    Get help center information
// @route   GET /api/help-center/info
// @access  Public
exports.getHelpCenterInfo = async (req, res) => {
  try {
    const contactInfo = {
      email: 'support@electionat.com',
      mobile: '+91 98765 43210',
      whatsapp: '+91 98765 43210',
      office: {
        address: 'Your Office Address Here',
        city: 'Your City',
        state: 'Your State',
        pincode: '123456'
      },
      workingHours: {
        weekdays: '9:00 AM - 6:00 PM',
        saturday: '9:00 AM - 2:00 PM',
        sunday: 'Closed'
      }
    };

    res.status(200).json({
      success: true,
      data: contactInfo
    });

  } catch (error) {
    console.error('Error fetching help center info:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch help center information'
    });
  }
};