using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;
using Projetos___4.Application.Mapping.Interfaces;

namespace Projetos___4.Application.Mapping;

public class UserXCategoryMapping : IUserXCategoryMapping
{
    public UserXCategoryDTO ToRequestDTO(List<int> categoryIds, string userId)
    {
        return new UserXCategoryDTO
        {
            UserId = userId,
            CategoryIds = categoryIds
        };
    }

    public List<UserXCategory> ToModels(UserXCategoryDTO dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        var links = new List<UserXCategory>();
        foreach (var categoryId in dto.CategoryIds.Distinct())
        {
            links.Add(new UserXCategory
            {
                UserId = dto.UserId,
                CategoryId = categoryId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        return links;
    }

    public UserXCategoryDTO ToDTO(IEnumerable<UserXCategory> links, string userId)
    {
        ArgumentNullException.ThrowIfNull(links);
        return new UserXCategoryDTO
        {
            UserId = userId,
            CategoryIds = links.Select(link => link.CategoryId).ToList()
        };
    }
}
