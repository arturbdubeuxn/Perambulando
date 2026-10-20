using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.AppServices
{
    public class UserXCategoryAppService : IUserXCategoryAppService
    {
        private readonly IUserXCategoryService _userXCategoryService;
        public UserXCategoryAppService(IUserXCategoryService userXCategoryService)
        {
            _userXCategoryService = userXCategoryService;
        }

        public async Task<UserXCategory?> AddCategoryToUserAsync(UserXCategoryDTO dto)
        {
            if (dto == null)
            {
                throw new ArgumentNullException(nameof(dto));
            }

            foreach (var categoryId in dto.CategoryIds)
            {
                var userXCategory = new UserXCategory
                {
                    UserId = dto.UserId,
                    CategoryId = categoryId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _userXCategoryService.AddAsync(userXCategory);
            }
            return null;
        }


    }
}
