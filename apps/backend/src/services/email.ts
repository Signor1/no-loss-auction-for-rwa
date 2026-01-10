import nodemailer from 'nodemailer'

// Email interface
export interface EmailOptions {
  to: string | string[]
  subject: string
  template?: string
  html?: string
  text?: string
  data?: Record<string, any>
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

// Email service class
export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    // Create transporter based on environment
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }

  // Send email
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@no-loss-auction.com',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments
      }

      // Handle template rendering
      if (options.template) {
        const html = await this.renderTemplate(options.template, options.data || {})
        mailOptions.html = html
      }

      await this.transporter.sendMail(mailOptions)
    } catch (error) {
      console.error('Email sending error:', error)
      throw new Error('Failed to send email')
    }
  }

  // Render email template (simplified implementation)
  private async renderTemplate(template: string, data: Record<string, any>): Promise<string> {
    // In a real implementation, you would use a template engine like Handlebars or EJS
    switch (template) {
      case 'email-verification':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify Your Email Address</h2>
            <p>Hi ${data.firstName},</p>
            <p>Thank you for registering with No-Loss Auction. Please click the link below to verify your email address:</p>
            <a href="${data.verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Verify Email</a>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>Best regards,<br>The No-Loss Auction Team</p>
          </div>
        `
      
      case 'password-reset':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>Hi ${data.firstName},</p>
            <p>We received a request to reset your password. Click the link below to reset it:</p>
            <a href="${data.resetLink}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <p>Best regards,<br>The No-Loss Auction Team</p>
          </div>
        `
      
      case 'password-reset-confirmation':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Successful</h2>
            <p>Hi ${data.firstName},</p>
            <p>Your password has been successfully reset.</p>
            <p>If you didn't make this change, please contact our support team immediately.</p>
            <p>Best regards,<br>The No-Loss Auction Team</p>
          </div>
        `
      
      case 'password-change-confirmation':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Changed Successfully</h2>
            <p>Hi ${data.firstName},</p>
            <p>Your password has been successfully changed.</p>
            <p>If you didn't make this change, please contact our support team immediately.</p>
            <p>Best regards,<br>The No-Loss Auction Team</p>
          </div>
        `
      
      case 'email-verification-confirmation':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Verified Successfully</h2>
            <p>Hi ${data.firstName},</p>
            <p>Your email address has been successfully verified.</p>
            <p>You can now start using all features of No-Loss Auction.</p>
            <p>Best regards,<br>The No-Loss Auction Team</p>
          </div>
        `
      
      case 'auction-ended':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Auction Ended</h2>
            <p>Hi ${data.firstName},</p>
            <p>The auction "${data.auctionTitle}" has ended.</p>
            <p>Final bid: ${data.finalBid} ETH</p>
            <p>Winner: ${data.winner}</p>
            <a href="${data.auctionLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">View Auction</a>
            <p>Best regards,<br>The No-Loss Auction Team</p>
          </div>
        `
      
      case 'bid-placed':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Bid Placed Successfully</h2>
            <p>Hi ${data.firstName},</p>
            <p>Your bid of ${data.bidAmount} ETH has been successfully placed on "${data.auctionTitle}".</p>
            <a href="${data.auctionLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">View Auction</a>
            <p>Best regards,<br>The No-Loss Auction Team</p>
          </div>
        `
      
      case 'outbid':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">You've Been Outbid</h2>
            <p>Hi ${data.firstName},</p>
            <p>You've been outbid on "${data.auctionTitle}". The new highest bid is ${data.newBid} ETH.</p>
            <a href="${data.auctionLink}" style="background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Place New Bid</a>
            <p>Best regards,<br>The No-Loss Auction Team</p>
          </div>
        `
      
      default:
        return `<p>Email content for template: ${template}</p>`
    }
  }

  // Send verification email
  async sendVerificationEmail(email: string, firstName: string, verificationLink: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Verify your email address',
      template: 'email-verification',
      data: { firstName, verificationLink }
    })
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, firstName: string, resetLink: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Reset your password',
      template: 'password-reset',
      data: { firstName, resetLink }
    })
  }

  // Send auction notification
  async sendAuctionNotification(email: string, firstName: string, auctionData: any): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `Auction Update: ${auctionData.title}`,
      template: 'auction-ended',
      data: { firstName, ...auctionData }
    })
  }

  // Send bid notification
  async sendBidNotification(email: string, firstName: string, bidData: any): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Bid Placed Successfully',
      template: 'bid-placed',
      data: { firstName, ...bidData }
    })
  }

  // Send outbid notification
  async sendOutbidNotification(email: string, firstName: string, outbidData: any): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'You\'ve Been Outbid',
      template: 'outbid',
      data: { firstName, ...outbidData }
    })
  }

  // Send welcome email
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to No-Loss Auction',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to No-Loss Auction!</h2>
          <p>Hi ${firstName},</p>
          <p>Welcome to No-Loss Auction! We're excited to have you join our community.</p>
          <p>Get started by exploring our auctions or creating your own.</p>
          <a href="${process.env.FRONTEND_URL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Get Started</a>
          <p>Best regards,<br>The No-Loss Auction Team</p>
        </div>
      `
    })
  }
}

// Create and export email service instance
export const emailService = new EmailService()

// Export sendEmail function for backward compatibility
export const sendEmail = emailService.sendEmail.bind(emailService)
