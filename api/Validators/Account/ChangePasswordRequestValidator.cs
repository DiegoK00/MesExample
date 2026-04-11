using Api.DTOs.Account;
using FluentValidation;

namespace Api.Validators.Account;

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty();

        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(128)
            .NotEqual(x => x.CurrentPassword).WithMessage("La nuova password deve essere diversa da quella attuale.");
    }
}
