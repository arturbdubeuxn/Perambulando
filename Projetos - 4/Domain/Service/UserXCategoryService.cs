using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Service
{
    public class UserXCategoryService : IUserXCategoryService
    {
        private readonly IUserXCategoryRepository _userXCategoryRepository;
        private readonly ICategoryService _categoryService;
        public UserXCategoryService(IUserXCategoryRepository userXCategoryRepository, ICategoryService categoryService)
        {
            _userXCategoryRepository = userXCategoryRepository;
            _categoryService = categoryService;
        }

        public async Task<List<UserXCategory>> AddAsync(string userId, IReadOnlyCollection<UserXCategory> userCategories)
        {
            ArgumentNullException.ThrowIfNull(userCategories);

            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("Informe o usuário.", nameof(userId));
            }

            if (userCategories.Count == 0)
            {
                return new List<UserXCategory>();
            }

            if (userCategories.Any(link => link.UserId != userId))
            {
                throw new ArgumentException("As categorias devem pertencer ao usuário informado.", nameof(userCategories));
            }

            var activeCategories = await _categoryService.GetallCategories();
            var activeCategoryIds = activeCategories.Where(category => category.IsActive)
                .Select(category => category.Id).ToHashSet();

            if (userCategories.Any(link => link.CategoryId <= 0 || !activeCategoryIds.Contains(link.CategoryId)))
            {
                throw new ArgumentException("Uma ou mais categorias não existem ou estão inativas.", nameof(userCategories));
            }

            return await _userXCategoryRepository.AddAsync(userCategories);
        }

        public async Task<List<UserXCategory>> EditAsync(string userId, IReadOnlyCollection<UserXCategory> newLinks)
        {

            ArgumentNullException.ThrowIfNull(newLinks);

            var newCategories = newLinks.Select(link => link.CategoryId).Distinct()
                .Select(id => new Category { Id = id }).ToList();

            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("Informe o usuário.", nameof(userId));
            }

            var activeCategories = await _categoryService.GetallCategories();
            var activeCategoryIds = activeCategories.Where(category => category.IsActive)
                .Select(category => category.Id).ToHashSet();

            if (newCategories.Any(category => category.Id <= 0 || !activeCategoryIds.Contains(category.Id)))
            {
                throw new ArgumentException("Uma ou mais categorias não existem ou estão inativas.", nameof(newLinks));
            }

            var currentCategories = await _categoryService.GetAllCategoriesPrefereces(userId);
            var categoriesToAdd = new List<Category>();
            var categoriesTodelete = new List<Category>();


            foreach (var currentCategory in currentCategories)
            {
                if (!newCategories.Any(c => c.Id == currentCategory.Id))
                {
                    categoriesTodelete.Add(currentCategory);
                }
            }

            foreach (var newCategory in newCategories)
            {
                bool existing = currentCategories.Any(c => c.Id == newCategory.Id);

                if (existing == false)
                {
                    categoriesToAdd.Add(newCategory);
                }

            }

            var LinkstoAdd = categoriesToAdd.Select(c => new UserXCategory
            {
                UserId = userId,
                CategoryId = c.Id
            }).ToList();

            var LinkstoDelete = categoriesTodelete.Select(c => new UserXCategory
            {
                UserId = userId,
                CategoryId = c.Id
            }).ToList();

            return await _userXCategoryRepository.EditAsync(userId, LinkstoAdd, LinkstoDelete, currentCategories.Select(category => category.Id).ToList());
        }
    }
}
