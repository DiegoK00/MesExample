using Resend;

namespace Api.Services;

public class EmailService(IResend resend, IConfiguration config) : IEmailService
{
    public async Task SendPasswordResetEmailAsync(string toEmail, string resetToken)
    {
        var frontendUrl = config["App:FrontendUrl"]!.TrimEnd('/');
        var resetUrl = $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(resetToken)}";

        var message = new EmailMessage();
        message.From = config["Resend:From"]!;
        message.To.Add(toEmail);
        message.Subject = "Reset della tua password";
        message.HtmlBody = $"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
              <h2>Reset della tua password</h2>
              <p>Hai richiesto di reimpostare la password del tuo account.</p>
              <p>
                <a href="{resetUrl}"
                   style="display:inline-block;padding:12px 24px;background:#1976d2;color:#fff;text-decoration:none;border-radius:4px;">
                  Reimposta la password
                </a>
              </p>
              <p>Il link è valido per <strong>1 ora</strong>.</p>
              <p style="color:#666;font-size:13px;">
                Se non hai richiesto il reset della password, ignora questa email.
              </p>
            </body>
            </html>
            """;

        await resend.EmailSendAsync(message);
    }
}
