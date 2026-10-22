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

        public async Task<UserXCategory?> AddAsync(UserXCategory userXCategory)
        {
            if (userXCategory == null)
            {
                throw new ArgumentNullException(nameof(userXCategory));
            }
            return await _userXCategoryRepository.AddAsync(userXCategory);
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

            if (newCategories.Count == 0)
            {
                throw new ArgumentException("Selecione pelo menos uma categoria.", nameof(newCategories));
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

            return await _userXCategoryRepository.EditAsync(userId, LinkstoAdd, LinkstoDelete);
        }
    }
}
