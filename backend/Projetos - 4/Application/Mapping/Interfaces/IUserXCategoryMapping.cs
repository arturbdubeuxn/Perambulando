using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Mapping.Interfaces;

public interface IUserXCategoryMapping
{
    UserXCategoryDTO ToRequestDTO(List<int> categoryIds, string userId);
    List<UserXCategory> ToModels(UserXCategoryDTO dto);
    UserXCategoryDTO ToDTO(IEnumerable<UserXCategory> links, string userId);
}
