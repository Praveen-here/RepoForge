// Email templates. Email clients ignore <style> tags and modern CSS,
// so the layout uses tables and inline styles.

export function magicLinkEmail({ url, minutes }) {
  const subject = 'Sign in to RepoForge';

  const text = [
    'Sign in to RepoForge',
    '',
    `Open this link to sign in. It expires in ${minutes} minutes and can only be used once:`,
    url,
    '',
    "If you didn't request this email, you can safely ignore it.",
  ].join('\n');

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#1a1a1a;border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            <tr>
              <td style="padding:32px 32px 8px;">
                <span style="display:inline-block;width:28px;height:28px;line-height:28px;border-radius:7px;background:#ffa116;color:#1a1a1a;font-weight:700;font-size:14px;text-align:center;vertical-align:middle;">&lt;/&gt;</span>
                <span style="font-size:20px;font-weight:700;color:#ffffff;vertical-align:middle;margin-left:8px;">RepoForge</span>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;color:rgba(255,255,255,0.55);font-size:13px;">Fix real bugs in real codebases</td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px;color:#f5f5f5;font-size:15px;line-height:22px;">
                Click the button below to sign in to your account. This link expires in ${minutes === 60 ? 'one hour' : `${minutes} minutes`} and can only be used once.
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;">
                <a href="${url}" style="display:inline-block;padding:12px 28px;border-radius:8px;background:#ffa116;color:#1a1a1a;font-size:15px;font-weight:700;text-decoration:none;">Sign in</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;color:rgba(255,255,255,0.4);font-size:12px;line-height:18px;">
                Button not working? Paste this link into your browser:<br />
                <a href="${url}" style="color:rgba(255,255,255,0.55);word-break:break-all;">${url}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 28px;border-top:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.4);font-size:12px;">
                If you didn't request this email, you can safely ignore it.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
