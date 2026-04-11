using Api.DTOs.Programs;
using FluentValidation;

namespace Api.Validators.Programs;

public class UpdateProgramRequestValidator : AbstractValidator<UpdateProgramRequest>
{
    public UpdateProgramRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Description)
            .MaximumLength(500);
    }
}
