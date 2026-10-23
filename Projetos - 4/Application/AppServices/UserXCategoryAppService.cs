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

            if (dto.CategoryIds == null)
            {
                throw new ArgumentException("Informe uma lista de categorias; use [] para nenhuma seleção.");
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

                results.Add(userXCategory);
            }

            return await _userXCategoryService.AddAsync(dto.UserId, results);
        }

        public async Task<List<UserXCategory>> EditCategoryToUserAsync(UserXCategoryDTO dto)
        {
            if (dto == null)
            {
                throw new ArgumentNullException(nameof(dto));
            }

            if (dto.CategoryIds == null)
            {
                throw new ArgumentException("Informe uma lista de categorias; use [] para nenhuma seleção.");
            }

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

            return await _userXCategoryService.EditAsync(dto.UserId, links);
        }
    }
}
