using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model.User;
using Projetos___4.Domain.Validations.Interface;

namespace Projetos___4.Domain.Validations.Validations;

public class UserXCategoryValidations : IUserXCategoryValidations
{
    private readonly ICategoryService _categoryService;

    public UserXCategoryValidations(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    public async Task Validate(string userId, IReadOnlyCollection<UserXCategory> userCategories)
    {
        await ValidateSelection(userId, userCategories);
        if (userCategories.Count == 0)
        {
            return;
        }

        var currentCategories = await _categoryService.GetAllCategoriesPrefereces(userId);
        if (currentCategories.Select(category => category.Id).Union(userCategories.Select(link => link.CategoryId)).Count() > 3)
        {
            throw new ArgumentException("O usuário pode ter no máximo 3 categorias de preferência.");
        }
    }

    public Task ValidateEdit(string userId, IReadOnlyCollection<UserXCategory> userCategories)
    {
        return ValidateSelection(userId, userCategories);
    }

    private async Task ValidateSelection(string userId, IReadOnlyCollection<UserXCategory> userCategories)
    {
        ArgumentNullException.ThrowIfNull(userCategories);

        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("Informe o usuário.", nameof(userId));
        }

        if (userCategories.Count == 0)
        {
            return;
        }

        if (userCategories.Any(link => link.UserId != userId))
        {
            throw new ArgumentException("As categorias devem pertencer ao usuário informado.", nameof(userCategories));
        }

        if (userCategories.Select(link => link.CategoryId).Distinct().Count() > 3)
        {
            throw new ArgumentException("Selecione no máximo 3 categorias de preferência.");
        }

        var activeCategories = await _categoryService.GetallCategories();
        var activeCategoryIds = activeCategories.Where(category => category.IsActive)
            .Select(category => category.Id).ToHashSet();

        if (userCategories.Any(link => link.CategoryId <= 0 || !activeCategoryIds.Contains(link.CategoryId)))
        {
            throw new ArgumentException("Uma ou mais categorias não existem ou estão inativas.", nameof(userCategories));
        }
    }
}
