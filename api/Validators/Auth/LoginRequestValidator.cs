using Api.DTOs.Auth;
using FluentValidation;

namespace Api.Validators.Auth;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);

        RuleFor(x => x.Password)
            .NotEmpty()
            .MaximumLength(128);

        RuleFor(x => x.Area)
            .IsInEnum();
    }
}
