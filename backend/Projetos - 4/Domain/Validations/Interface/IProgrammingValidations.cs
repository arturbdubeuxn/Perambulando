using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Validations.Interface;

public interface IProgrammingValidations
{
    void ValidateProgramming(Programming programming, IReadOnlyCollection<ProgrammingXCategory> links, DateTime now);
}