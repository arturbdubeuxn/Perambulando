using Projetos___4.Domain.Model;
namespace Projetos___4.Domain.Validations.Interface;
public interface INearbyValidations
{
    Task ValidateUserAsync(string? userId);
    void Validate(NearbyFilter filter);
    void ValidateDestination(int id, int skip);
}
