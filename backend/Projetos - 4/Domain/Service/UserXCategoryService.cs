using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Validations.Interface;

namespace Projetos___4.Domain.Service
{
    public class UserXCategoryService : IUserXCategoryService
    {
        private readonly IUserXCategoryRepository _userXCategoryRepository;
        private readonly ICategoryService _categoryService;
        private readonly IUserXCategoryValidations _userXCategoryValidations;
        public UserXCategoryService(IUserXCategoryRepository userXCategoryRepository, ICategoryService categoryService,
            IUserXCategoryValidations userXCategoryValidations)
        {
            _userXCategoryRepository = userXCategoryRepository;
            _categoryService = categoryService;
            _userXCategoryValidations = userXCategoryValidations;
        }

        public async Task<List<UserXCategory>> AddAsync(string userId, IReadOnlyCollection<UserXCategory> userCategories)
        {
            await _userXCategoryValidations.Validate(userId, userCategories);

            if (userCategories.Count == 0)
            {
                return new List<UserXCategory>();
            }

            return await _userXCategoryRepository.AddAsync(userCategories);
        }

        public async Task<List<UserXCategory>> EditAsync(string userId, IReadOnlyCollection<UserXCategory> newLinks)
        {
            ArgumentNullException.ThrowIfNull(newLinks);
            if (newLinks.Select(link => link.CategoryId).Distinct().Count() > 3)
            {
                throw new ArgumentException("Selecione no máximo 3 categorias de preferência.");
            }

            var newCategories = newLinks.Select(link => link.CategoryId).Distinct()
                .Select(id => new Category { Id = id }).ToList();

            var activeCategories = await _categoryService.GetallCategories();

            if (newCategories.Any(category => category.Id <= 0))
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

            return await _userXCategoryRepository.EditAsync(userId, LinkstoAdd, LinkstoDelete);
        }
    }
}
