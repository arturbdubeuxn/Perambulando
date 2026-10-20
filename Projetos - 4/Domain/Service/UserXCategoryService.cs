using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Service
{
    public class UserXCategoryService : IUserXCategoryService
    {
        private readonly IUserXCategoryRepository _userXCategoryRepository;
        public UserXCategoryService(IUserXCategoryRepository userXCategoryRepository)
        {
            _userXCategoryRepository = userXCategoryRepository;
        }

        public async Task<UserXCategory?> AddAsync(UserXCategory userXCategory)
        {
            if (userXCategory == null)
            {
                throw new ArgumentNullException(nameof(userXCategory));
            }
            return await _userXCategoryRepository.AddAsync(userXCategory);
        }
    }
}
