import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendTeamInviteEmail({
  to,
  teamName,
  role,
  loginUrl,
}: {
  to: string
  teamName: string
  role: string
  loginUrl: string
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">You've been invited to join ${teamName}!</h2>
      <p style="font-size: 16px; color: #555;">
        You've been invited to join <strong>${teamName}</strong> as <strong>${role}</strong>.
      </p>
      <p style="font-size: 16px; color: #555;">
        You already have an account. Log in and check your <strong>Notifications</strong> to accept or decline this invitation.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}?email=${encodeURIComponent(to)}" style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px;">
          Log In to Accept
        </a>
      </div>
      <p style="font-size: 14px; color: #999;">
        If you didn't expect this invitation, you can ignore this email.
      </p>
    </div>
  `

  return transporter.sendMail({
    from: `"Team" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: `You've been invited to join ${teamName}`,
    html,
  })
}

export async function sendSignupInviteEmail({
  to,
  teamName,
  role,
  signupUrl,
  invitedBy,
}: {
  to: string
  teamName: string
  role: string
  signupUrl: string
  invitedBy: string
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">You've been invited to join ${teamName}!</h2>
      <p style="font-size: 16px; color: #555;">
        <strong>${invitedBy}</strong> has invited you to join <strong>${teamName}</strong> as <strong>${role}</strong>.
      </p>
      <p style="font-size: 16px; color: #555;">
        Create your account to get started. Once you sign up, you'll automatically be added to the team.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${signupUrl}?email=${encodeURIComponent(to)}" style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px;">
          Sign Up to Join
        </a>
      </div>
      <p style="font-size: 14px; color: #999;">
        If you didn't expect this invitation, you can ignore this email.
      </p>
    </div>
  `

  return transporter.sendMail({
    from: `"Team" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: `${invitedBy} invited you to join ${teamName}`,
    html,
  })
}
