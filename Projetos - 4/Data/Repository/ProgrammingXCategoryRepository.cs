using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Repository
{
    public class ProgrammingXCategoryRepository : IProgrammingXCategoryRepository
    {
        private readonly Context.Context Db;
        public ProgrammingXCategoryRepository(Context.Context db)
        {
            Db = db;
        }
        public Task<ProgrammingXCategory> CreateProgrammingXCategoryAsync(ProgrammingXCategory programmingXCategory)
        {
            if (programmingXCategory == null)
            {
                throw new ArgumentNullException(nameof(programmingXCategory));
            }

            Db.Add(programmingXCategory);
            return Task.FromResult(programmingXCategory);
        }
    }
}
