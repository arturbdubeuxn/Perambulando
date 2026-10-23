using Projetos___4.Application.DTO;

namespace Projetos___4.Application.Interfaces
{
    public interface IUserXCategoryAppService
    {
        Task <UserXCategoryDTO> AddCategoryToUserAsync(List<int> categorysId, string userId);
        Task <UserXCategoryDTO> EditCategoryToUserAsync(List<int> categorysId, string userId);
    }
}
