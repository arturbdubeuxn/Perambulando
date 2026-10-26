using Microsoft.EntityFrameworkCore;
using Npgsql;
using Projetos___4.Domain.Exceptions;
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

        public Task<List<ProgrammingXCategory>> GetAllByProgrammingIdAsync(int programmingId)
        {
            return Db.ProgrammingXCategories
                .Where(link => link.ProgrammingId == programmingId)
                .OrderBy(link => link.Id)
                .ToListAsync();
        }
        }
    
}
