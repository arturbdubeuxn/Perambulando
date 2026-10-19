using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Service
{
    public class ProgrammingXCategoryService : IProgrammingXCategoryService
    {
        private readonly IProgrammingXCategoryRepository _programmingXCategoryRepository;

        public ProgrammingXCategoryService(IProgrammingXCategoryRepository programmingXCategoryRepository)
        {
            _programmingXCategoryRepository = programmingXCategoryRepository;
        }
        public Task<ProgrammingXCategory> CreateProgrammingXCategoryAsync(ProgrammingXCategory programmingXCategory)
        {
            if(programmingXCategory == null)
            {
                throw new ArgumentNullException(nameof(programmingXCategory));
            }

            return _programmingXCategoryRepository.CreateProgrammingXCategoryAsync(programmingXCategory);
        }
    }
}
