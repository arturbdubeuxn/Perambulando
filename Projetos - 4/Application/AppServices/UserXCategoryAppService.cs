using Microsoft.AspNetCore.Identity;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Application.Validations.Interfaces;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.AppServices
{
    public class UserXCategoryAppService : IUserXCategoryAppService
    {
        private readonly IUserXCategoryService _userXCategoryService;
        private readonly IValidation<UserXCategoryDTO> _userXCategoryValidation;
        private readonly UserManager<User> _userManager;

        public UserXCategoryAppService(IUserXCategoryService userXCategoryService, IValidation<UserXCategoryDTO> userXCategoryValidation, UserManager<User> userManager)
        {
            _userXCategoryService = userXCategoryService;
            _userXCategoryValidation = userXCategoryValidation;
            _userManager = userManager;
        }

        public async Task<UserXCategoryDTO> AddCategoryToUserAsync(List<int> categorysId, string userId)
        {
            var dto = new UserXCategoryDTO
            {
                UserId = userId,
                CategoryIds = categorysId

            };

            _userXCategoryValidation.Validate(dto, DateTime.UtcNow);

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
            List<UserXCategory> userXCategories = await _userXCategoryService.AddAsync(dto.UserId, results);

            var savedCategoryIds = new List<int>();

            foreach (var userXCategory in userXCategories)
            {
                savedCategoryIds.Add(userXCategory.CategoryId);
            }

            return new UserXCategoryDTO
            {
                UserId = dto.UserId,
                CategoryIds = savedCategoryIds
            };
        }

        public async Task<UserXCategoryDTO> EditCategoryToUserAsync(List<int> categorysId, string userId)
        {
            var dto = new UserXCategoryDTO
            {
                UserId = userId,
                CategoryIds = categorysId
            };

            _userXCategoryValidation.Validate(dto, DateTime.UtcNow);

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

            List<UserXCategory> userXCategories = await _userXCategoryService.EditAsync(dto.UserId, links);

            var savedCategoryIds = new List<int>();

            foreach (var userXCategory in userXCategories)
            {
                savedCategoryIds.Add(userXCategory.CategoryId);
            }

            return new UserXCategoryDTO
            {
                UserId = dto.UserId,
                CategoryIds = savedCategoryIds
            };
        }
    }
}
