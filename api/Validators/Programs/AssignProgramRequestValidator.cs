using Api.DTOs.Programs;
using FluentValidation;

namespace Api.Validators.Programs;

public class AssignProgramRequestValidator : AbstractValidator<AssignProgramRequest>
{
    public AssignProgramRequestValidator()
    {
        RuleFor(x => x.ProgramIds)
            .NotNull();

        RuleForEach(x => x.ProgramIds)
            .GreaterThan(0);
    }
}
