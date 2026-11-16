using Microsoft.EntityFrameworkCore;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Service;

namespace Projetos___4.Data.Repository
{
    public class RoadmapRepository : IRoadmapRepository
    {
        private readonly Context.Context Db;

        public RoadmapRepository(Context.Context context)
        {
            Db = context;
        }
        public Task<Roadmap> CreateRoadmapAsync(Roadmap roadmap)
        {
            Db.Roadmaps.Add(roadmap);
            Db.SaveChanges();
            return Task.FromResult(roadmap);

        }

        public Task<bool> DeleteRoadmapAsync(Roadmap roadmap)
        {
           
            Db.Roadmaps.Update(roadmap);
            Db.SaveChanges();
            return Task.FromResult(true);
        }

        public Task<List<Roadmap>> GetAllRoadmapsByUserIdAsync(string userId)
        {
            var roadmaps = Db.Roadmaps.Include(r => r.roadmapProgrammings).ThenInclude(stop => stop.Programming).ThenInclude(p => p.Address).Include(r => r.roadmapProgrammings).ThenInclude(stop => stop.Host).ThenInclude(h => h.Address).Include(r => r.roadmapProgrammings).ThenInclude(stop => stop.Programming).ThenInclude(p => p.ProgrammingXCategories).ThenInclude(link => link.Category).Where(r => r.UserId == userId && r.IsActive).ToList();
            return Task.FromResult(roadmaps);
        }

        public async Task<Roadmap> GetRoadmapByIdAsync(int roadmapId)
        {
            var roadmap = await Db.Roadmaps.Include(r => r.roadmapProgrammings).ThenInclude(stop => stop.Programming).ThenInclude(p => p.Address).Include(r => r.roadmapProgrammings).ThenInclude(stop => stop.Host).ThenInclude(h => h.Address).Include(r => r.roadmapProgrammings).ThenInclude(stop => stop.Programming).ThenInclude(p => p.ProgrammingXCategories).ThenInclude(link => link.Category).FirstOrDefaultAsync(r => r.Id == roadmapId);
            if (roadmap == null || !roadmap.IsActive)
            {
                throw new KeyNotFoundException($"Roadmap with ID {roadmapId} not found or is inactive.");
            }
            return roadmap;
        }

        public async Task<Roadmap> UpdateRoadmapAsync(Roadmap roadmap)
        {
            Db.Roadmaps.Update(roadmap);
            await Db.SaveChangesAsync();
            return roadmap;
        }
    }
}


