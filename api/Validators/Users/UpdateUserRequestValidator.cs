using Api.DTOs.Users;
using FluentValidation;

namespace Api.Validators.Users;

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
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
    }
}
