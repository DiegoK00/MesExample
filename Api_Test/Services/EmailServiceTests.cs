using Api.Services;
using Microsoft.Extensions.Configuration;
using Moq;
using Resend;

namespace Api.Tests.Services;

public class EmailServiceTests
{
    private static IConfiguration BuildConfig(
        string frontendUrl = "https://mesclaude.com",
        string from = "noreply@mesclaude.com") =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["App:FrontendUrl"] = frontendUrl,
                ["Resend:From"] = from,
                ["Resend:ApiKey"] = "test-key"
            })
            .Build();

    private static (Mock<IResend> mockResend, EmailService service) Build(IConfiguration? config = null)
    {
        var mockResend = new Mock<IResend>();
        mockResend
            .Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ResendResponse<EmailSendResponse>());
        var service = new EmailService(mockResend.Object, config ?? BuildConfig());
        return (mockResend, service);
    }

    [Fact]
    public async Task SendPasswordResetEmailAsync_CallsResendOnce()
    {
        var (mockResend, service) = Build();

        await service.SendPasswordResetEmailAsync("user@test.com", "my-token");

        mockResend.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SendPasswordResetEmailAsync_SetsCorrectTo()
    {
        var (mockResend, service) = Build();
        EmailMessage? sent = null;
        mockResend
            .Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((msg, _) => sent = msg)
            .ReturnsAsync(new ResendResponse<EmailSendResponse>());

        await service.SendPasswordResetEmailAsync("user@test.com", "my-token");

        Assert.NotNull(sent);
        Assert.Contains("user@test.com", sent.To);
    }

    [Fact]
    public async Task SendPasswordResetEmailAsync_SetsCorrectFrom()
    {
        var (mockResend, service) = Build(BuildConfig(from: "noreply@mesclaude.com"));
        EmailMessage? sent = null;
        mockResend
            .Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((msg, _) => sent = msg)
            .ReturnsAsync(new ResendResponse<EmailSendResponse>());

        await service.SendPasswordResetEmailAsync("user@test.com", "my-token");

        Assert.NotNull(sent);
        Assert.Equal("noreply@mesclaude.com", sent.From);
    }

    [Fact]
    public async Task SendPasswordResetEmailAsync_HtmlBodyContainsResetUrl()
    {
        var (mockResend, service) = Build(BuildConfig(frontendUrl: "https://mesclaude.com"));
        EmailMessage? sent = null;
        mockResend
            .Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((msg, _) => sent = msg)
            .ReturnsAsync(new ResendResponse<EmailSendResponse>());

        await service.SendPasswordResetEmailAsync("user@test.com", "abc123");

        Assert.NotNull(sent?.HtmlBody);
        Assert.Contains("https://mesclaude.com/reset-password?token=abc123", sent.HtmlBody);
    }

    [Fact]
    public async Task SendPasswordResetEmailAsync_TokenIsUrlEncoded()
    {
        var (mockResend, service) = Build();
        EmailMessage? sent = null;
        mockResend
            .Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((msg, _) => sent = msg)
            .ReturnsAsync(new ResendResponse<EmailSendResponse>());

        // Token con caratteri speciali (Base64 contiene +, /, =)
        await service.SendPasswordResetEmailAsync("user@test.com", "abc+def/123=");

        Assert.NotNull(sent?.HtmlBody);
        Assert.DoesNotContain("abc+def/123=", sent.HtmlBody); // non deve apparire non-encoded
        Assert.Contains(Uri.EscapeDataString("abc+def/123="), sent.HtmlBody);
    }

    [Fact]
    public async Task SendPasswordResetEmailAsync_FrontendUrlTrailingSlashTrimmed()
    {
        var (mockResend, service) = Build(BuildConfig(frontendUrl: "https://mesclaude.com/"));
        EmailMessage? sent = null;
        mockResend
            .Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((msg, _) => sent = msg)
            .ReturnsAsync(new ResendResponse<EmailSendResponse>());

        await service.SendPasswordResetEmailAsync("user@test.com", "tok");

        Assert.NotNull(sent?.HtmlBody);
        // Non deve contenere doppio slash //reset-password
        Assert.DoesNotContain("//reset-password", sent.HtmlBody);
        Assert.Contains("https://mesclaude.com/reset-password", sent.HtmlBody);
    }
}
