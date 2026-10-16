using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Model;
using Microsoft.EntityFrameworkCore;

namespace Projetos___4.Data.Repository
{
    public class ProgrammingRepository : IProgrammingRepository
    {
        private readonly Context.Context Db;
        public ProgrammingRepository(Context.Context db)
        {
            Db = db;
        }
        public async Task<IEnumerable<Programming>> GetAllProgrammingsbyHostId(int hostId)
        {
            return await Db.Programmings
                .AsNoTracking()
                .Where(p => p.HostId == hostId && p.IsActive == true)
                .OrderBy(p => p.StartDate)
                .ToListAsync();
        }

        public Task<Programming?> GetByIdAsync(int programmingId, int? hostId = null)
        {
            return Db.Programmings
                .Include(p => p.Host)
                .FirstOrDefaultAsync(p => p.Id == programmingId && p.IsActive && p.Host.IsActive);
        }

        public async Task<Programming> EditAsync(Programming programming)
        {
            await Db.SaveChangesAsync();
            return programming;
        }

        public async Task<Programming> CreateWithCategoriesAsync(Programming programming, List<ProgrammingXCategory> links)
        {
            Db.Programmings.Add(programming);
            foreach (var link in links)
            {
                Db.ProgrammingXCategories.Add(link);
            }
            await Db.SaveChangesAsync();
            return programming;
        }
    }
}
