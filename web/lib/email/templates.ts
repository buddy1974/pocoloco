import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'noreply@pocoloco.app'

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to Pocoloco',
    html: `
      <h1>Welcome, ${name}</h1>
      <p>Your soccer intelligence platform is ready.</p>
      <p>Upload your stats spreadsheet to get personalised picks.</p>
      <p><a href="${process.env.AUTH_URL}/dashboard">Open dashboard →</a></p>
    `,
  })
}
