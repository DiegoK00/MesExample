using Api.DTOs.Users;
using FluentValidation;

namespace Api.Validators.Users;

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);

        RuleFor(x => x.Username)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(100)
            .Matches("^[a-zA-Z0-9_.-]+$").WithMessage("Username può contenere solo lettere, numeri, underscore, punto e trattino.");

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(128);

        RuleFor(x => x.LoginArea)
            .IsInEnum();
    }
}
