export function otpPasswordResetTemplate(data: {
    otp: string;
    expiresInMinutes: number;
}) {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Code — Veyra</title>
  </head>
  <body style="margin:0;padding:0;background:#000000;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Inter',sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#000000;">
      <tr><td align="center" style="padding:48px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
          
          <!-- Header -->
          <tr><td style="padding:0 0 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.02em;">Veyra</h1>
          </td></tr>
          
          <!-- Content -->
          <tr><td style="padding:0 0 32px;">
            <h2 style="margin:0 0 12px;color:#ffffff;font-size:28px;line-height:1.2;font-weight:600;letter-spacing:-0.03em;">Password reset code</h2>
            <p style="margin:0;font-size:16px;line-height:1.5;color:#a1a1a1;">A password reset was requested for your account. Use this code to continue:</p>
          </td></tr>
          
          <!-- OTP Code -->
          <tr><td style="padding:0 0 32px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr><td align="center" style="padding:32px 24px;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:8px;">
                <div style="font-size:40px;font-weight:600;letter-spacing:12px;color:#ffffff;font-family:'Courier New',Courier,monospace;">${data.otp}</div>
              </td></tr>
            </table>
          </td></tr>
          
          <tr><td style="padding:0 0 32px;">
            <p style="margin:0 0 4px;font-size:14px;line-height:1.5;color:#737373;">This code expires in ${data.expiresInMinutes} minutes.</p>
            <p style="margin:0;font-size:14px;line-height:1.5;color:#737373;">Do not share this code with anyone.</p>
          </td></tr>
          
          <tr><td style="padding:24px;background:#0f0a05;border-left:2px solid #d97634;border-radius:6px;">
            <p style="margin:0;font-size:13px;line-height:1.5;color:#d4d4d4;">
              <strong style="color:#ffffff;font-weight:600;">Did not request a password reset?</strong> Someone may be trying to access your account. Contact support immediately if you need assistance.
            </p>
          </td></tr>
          
          <!-- Footer -->
          <tr><td style="padding:40px 0 0;border-top:1px solid #1a1a1a;">
            <p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#525252;">This is an automated security message. This code is required to reset your password.</p>
            <p style="margin:0;font-size:12px;line-height:1.5;color:#404040;">© ${new Date().getFullYear()} Veyra. All rights reserved.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
