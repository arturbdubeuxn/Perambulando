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

        public async Task<List<UserXCategory>> AddCategoryToUserAsync(UserXCategoryDTO dto)
        {
            if (dto == null)
            {
                throw new ArgumentNullException(nameof(dto));
            }

            if (dto.CategoryIds == null || dto.CategoryIds.Count == 0)
            {
                throw new ArgumentException("Selecione pelo menos uma categoria.");
            }

            var results = new List<UserXCategory>();

            foreach (var categoryId in dto.CategoryIds.Distinct())
            {
                var userXCategory = new UserXCategory
                {
                    UserId = dto.UserId,
                    CategoryId = categoryId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var created = await _userXCategoryService.AddAsync(userXCategory);

                if (created == null)
                {
                    throw new InvalidOperationException(
                        "Não foi possível adicionar a categoria ao usuário.");
                }

                results.Add(created);
            }

            return results;
        }
    }
}

