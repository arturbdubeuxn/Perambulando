using Projetos___4.Domain.Model.User;

namespace Projetos___4.Domain.Validations.Interface;

public interface IUserXCategoryValidations
{
    Task Validate(string userId, IReadOnlyCollection<UserXCategory> userCategories);
    Task ValidateEdit(string userId, IReadOnlyCollection<UserXCategory> userCategories);
}
