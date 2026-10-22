using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Interfaces
{
    public interface IUserXCategoryAppService
    {
        Task <List<UserXCategory>> AddCategoryToUserAsync(UserXCategoryDTO dto);
        Task <List<UserXCategory>> EditCategoryToUserAsync(UserXCategoryDTO dto);
    }
}
