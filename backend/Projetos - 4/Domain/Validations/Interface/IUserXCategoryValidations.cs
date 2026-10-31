using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Validations.Interface;

public interface IUserXCategoryValidations
{
    Task Validate(string userId, IReadOnlyCollection<UserXCategory> userCategories);
}
