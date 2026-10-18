import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`

  await resend.emails.send({
    from: "T3 Vakfı Zirve <onboarding@resend.dev>",
    to: email,
    subject: "E-posta Adresinizi Doğrulayın",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0d2e; color: white; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="background: #E30613; display: inline-block; padding: 12px 24px; border-radius: 10px;">
            <span style="color: white; font-size: 32px; font-weight: bold;">T3</span>
          </div>
        </div>
        <h1 style="color: white; font-size: 24px; margin-bottom: 16px;">Merhaba ${name},</h1>
        <p style="color: #a0a8d0; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
          T3 Vakfı Zirve Yönetim Sistemi'ne kaydolduğunuz için teşekkürler. 
          Hesabınızı aktif etmek için aşağıdaki butona tıklayın.
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${verifyUrl}" 
            style="background: #E30613; color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
            E-postamı Doğrula
          </a>
        </div>
        <p style="color: #a0a8d0; font-size: 14px; text-align: center;">
          Bu link 24 saat geçerlidir. Eğer bu işlemi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
        </p>
        <hr style="border: 1px solid rgba(255,255,255,0.1); margin: 32px 0;" />
        <p style="color: rgba(255,255,255,0.3); font-size: 12px; text-align: center;">
          © 2025 T3 Vakfı — Tüm hakları saklıdır.
        </p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string, name: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  await resend.emails.send({
    from: "T3 Vakfı Zirve <onboarding@resend.dev>",
    to: email,
    subject: "Şifre Sıfırlama Talebi",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0d2e; color: white; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="background: #E30613; display: inline-block; padding: 12px 24px; border-radius: 10px;">
            <span style="color: white; font-size: 32px; font-weight: bold;">T3</span>
          </div>
        </div>
        <h1 style="color: white; font-size: 24px; margin-bottom: 16px;">Merhaba ${name},</h1>
        <p style="color: #a0a8d0; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
          Şifre sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${resetUrl}" 
            style="background: #E30613; color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
            Şifremi Sıfırla
          </a>
        </div>
        <p style="color: #a0a8d0; font-size: 14px; text-align: center;">
          Bu link 1 saat geçerlidir. Eğer bu işlemi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
        </p>
        <hr style="border: 1px solid rgba(255,255,255,0.1); margin: 32px 0;" />
        <p style="color: rgba(255,255,255,0.3); font-size: 12px; text-align: center;">
          © 2025 T3 Vakfı — Tüm hakları saklıdır.
        </p>
      </div>
    `,
  })
}