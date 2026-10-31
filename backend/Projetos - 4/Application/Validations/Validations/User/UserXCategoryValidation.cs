using Projetos___4.Application.DTO;
using Projetos___4.Application.Validations.Interfaces;

namespace Projetos___4.Application.Validations.Validations.User;

public class UserXCategoryValidation : IValidation<UserXCategoryDTO>
{
    public void Validate(UserXCategoryDTO dto, DateTime now)
    {
        if (dto.CategoryIds == null)
        {
            throw new ArgumentException("Informe uma lista de categorias; use [] para nenhuma seleção.");
        }

        if (dto.CategoryIds.Count > 3)
        {
            throw new ArgumentException("Selecione no máximo 3 categorias de preferência.");
        }

        if (dto.CategoryIds.Any(categoryId => categoryId <= 0))
        {
            throw new ArgumentException("Informe IDs de categorias maiores que zero.");
        }
    }
}