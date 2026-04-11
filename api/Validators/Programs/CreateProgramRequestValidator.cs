using Api.DTOs.Programs;
using FluentValidation;

namespace Api.Validators.Programs;

public class CreateProgramRequestValidator : AbstractValidator<CreateProgramRequest>
{
    public CreateProgramRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty()
            .MaximumLength(50)
            .Matches("^[A-Z0-9_]+$").WithMessage("Code deve contenere solo lettere maiuscole, numeri e underscore.");

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Description)
            .MaximumLength(500);
    }
}
