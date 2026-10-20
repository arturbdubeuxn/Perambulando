using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Interfaces
{
    public interface IUserXCategoryAppService
    {
        Task<UserXCategory?> AddCategoryToUserAsync(UserXCategoryDTO dto);
    }
}
