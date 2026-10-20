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
                .Where(p => p.HostId == hostId && p.IsActive && p.Host.IsActive)
                .OrderBy(p => p.StartDate)
                .ToListAsync();
        }

        public Task<Programming?> GetByIdAsync(int programmingId, int? hostId = null)
        {
            return Db.Programmings
                .Include(p => p.Host)
                .FirstOrDefaultAsync(p => p.Id == programmingId &&
                    (!hostId.HasValue || p.HostId == hostId.Value) &&
                    p.IsActive && p.Host.IsActive);
        }

        public async Task<Programming> EditAsync(Programming programming)
        {
            await Db.SaveChangesAsync();
            return programming;
        }

        public async Task<Programming> EditWithCategoriesAsync(Programming programming, List<ProgrammingXCategory> linksToAdd, List<int> categoryIdsToRemove)
        {
            var linksToRemove = await Db.ProgrammingXCategories
                .Where(link => link.ProgrammingId == programming.Id && categoryIdsToRemove.Contains(link.CategoryId))
                .ToListAsync();

            Db.ProgrammingXCategories.RemoveRange(linksToRemove);

            foreach (var link in linksToAdd)
            {
                link.Programming = programming;
                Db.ProgrammingXCategories.Add(link);
            }

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

        public async Task<List<Programming>> GetAllProgrammingsByUserCategories(List<int> categoryIds)
        {

            var query =
                from programming in Db.Programmings.AsNoTracking()
                join link in Db.ProgrammingXCategories
                    on programming.Id equals link.ProgrammingId
                join category in Db.Categories
                    on link.CategoryId equals category.Id
                where programming.IsActive
                    && programming.Host.IsActive
                    && category.IsActive
                    && categoryIds.Contains(category.Id)
                select programming;

            return await query
                .Distinct()
                .OrderBy(p => p.StartDate)
                .ToListAsync();



           
        }
    }
}
