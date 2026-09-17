export function verificationTemplate(data: {
    verificationUrl: string;
}) {
    return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f7f8fa;color:#5f6673;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f8fa;">
      <tr><td align="center" style="padding:32px 16px 24px;">
        <div style="margin:0 0 20px;color:#aeb9ca;font-size:28px;font-weight:700;letter-spacing:-1px;">fintech</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:545px;background:#ffffff;border:1px solid #eef0f4;border-radius:8px;overflow:hidden;">
          <tr><td style="padding:54px 72px 44px;">
            <div style="margin:0 auto 30px;width:116px;height:116px;border-radius:58px;background:#fff5ed;color:#f28b48;font-size:58px;line-height:116px;text-align:center;">✉</div>
            <h1 style="margin:0;color:#1f2940;font-size:26px;line-height:1.18;font-weight:700;">Verify your email address</h1>
            <p style="margin:24px 0 0;font-size:16px;line-height:1.6;">Thanks for creating your Fintech account. Confirm your email address to securely activate your account and continue.</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:28px 0 0;"><tr><td align="center" style="background:#3677e8;border-radius:6px;">
              <a href="${data.verificationUrl}" style="display:block;padding:15px 20px;color:#ffffff;font-size:16px;font-weight:700;line-height:1.2;text-align:center;text-decoration:none;">Verify email address</a>
            </td></tr></table>
            <p style="margin:24px 0 0;font-size:14px;line-height:1.6;">This link expires in 24 hours and can only be used once. If you did not create this account, you can safely ignore this email.</p>
            <p style="margin:20px 0 0;font-size:13px;line-height:1.5;word-break:break-all;">If the button does not work, copy and paste this link into your browser:<br><a href="${data.verificationUrl}" style="color:#3677e8;text-decoration:none;">${data.verificationUrl}</a></p>
          </td></tr>
          <tr><td style="padding:27px 72px 32px;background:#f6f7f9;border-top:1px solid #eef0f4;">
            <h2 style="margin:0;color:#1f2940;font-size:18px;line-height:1.3;">Have questions?</h2>
            <p style="margin:10px 0 0;font-size:14px;line-height:1.55;">Our support team is here to help you get started securely.</p>
          </td></tr>
        </table>
        <p style="margin:22px 0 0;color:#8a93a3;font-size:12px;line-height:1.6;text-align:center;">This is an automated security message from Fintech.</p>
      </td></tr>
    </table>
  </body>
</html>`;
}