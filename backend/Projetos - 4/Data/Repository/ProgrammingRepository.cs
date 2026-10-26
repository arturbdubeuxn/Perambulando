using Microsoft.EntityFrameworkCore;
using Npgsql;
using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Model;
using System.Net;

namespace Projetos___4.Data.Repository
{
    public class ProgrammingRepository : IProgrammingRepository
    {
        private readonly Context.Context Db;
        public ProgrammingRepository(Context.Context db)
        {
            Db = db;
        }
        public async Task<List<Programming>> GetAllProgrammingsAsync(int take, int skip)
        {
            var query =
                from programming in Db.Programmings.Include(p => p.Address).AsNoTracking()
                where programming.IsActive && programming.Host.IsActive
                orderby programming.StartDate, programming.Id
                select programming;

            return await query.Skip(skip).Take(take).ToListAsync();
        }

        public async Task<IEnumerable<Programming>> GetAllProgrammingsbyHostId(int hostId)
        {
            return await Db.Programmings
                .Include(p => p.Address)
                .AsNoTracking()
                .Where(p => p.HostId == hostId && p.IsActive && p.Host.IsActive)
                .OrderBy(p => p.StartDate)
                .ToListAsync();
        }

        public Task<Programming?> GetByIdAsync(int programmingId, int? hostId = null)
        {
            return Db.Programmings
                .Include(p => p.Host)
                .Include(p => p.Address)
                .FirstOrDefaultAsync(p => p.Id == programmingId &&
                    (!hostId.HasValue || p.HostId == hostId.Value) &&
                    p.IsActive && p.Host.IsActive);
        }

        public async Task<Programming> EditAsync(Programming programming)
        {
            if (programming.Address.Id == 0)
            {
                Db.Addresses.Add(programming.Address);
            }

            await Db.SaveChangesAsync();
            return programming;
        }

        public async Task<Programming> EditWithCategoriesAsync(Programming programming, List<ProgrammingXCategory> linksToAdd, List<int> categoryIdsToRemove, List<ProgrammingXCategory> currentLinks){
           await using var transaction = await Db.Database.BeginTransactionAsync();
            try
            {
                if (programming.AddressId == 0)
                {
                    Db.Addresses.Add(programming.Address);
                }

                var linksToRemove = currentLinks.Where(link => categoryIdsToRemove.Contains(link.CategoryId)).ToList();
                Db.ProgrammingXCategories.RemoveRange(linksToRemove);

                var currentIds = currentLinks.Select(link => link.CategoryId).ToHashSet();
                currentIds.ExceptWith(categoryIdsToRemove);

                foreach (var link in linksToAdd)
                {
                    if (currentIds.Add(link.CategoryId))
                    {
                        link.Programming = programming;
                        Db.ProgrammingXCategories.Add(link);
                    }
                }

                await Db.SaveChangesAsync();
                await transaction.CommitAsync();
                return programming;
            }
            catch (DbUpdateException ex)
            {
                throw new CategoryLinksConflictException();
            }
        }

        public async Task<Programming> CreateWithCategoriesAsync(Programming programming, List<ProgrammingXCategory> links)
        {
            if (programming.Address.Id == 0)
            {
                Db.Addresses.Add(programming.Address);
            }

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
                from programming in Db.Programmings.Include(p => p.Address).AsNoTracking()
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
