using Projetos___4.Application.DTO;

namespace Projetos___4.Application.Validations.Interfaces;

public interface IValidation<T>
{
    void Validate(T dto, DateTime now );
}
