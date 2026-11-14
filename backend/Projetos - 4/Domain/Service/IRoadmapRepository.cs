using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Service
{
    public interface IRoadmapRepository
    {
        Task<Roadmap> CreateRoadmapAsync(Roadmap roadmap);
        Task<bool> DeleteRoadmapAsync(Roadmap roadmap);
        Task<List<Roadmap>> GetAllRoadmapsByUserIdAsync(string userId);
        Task<Roadmap> GetRoadmapByIdAsync(int roadmapId);
        Task<Roadmap> UpdateRoadmapAsync(Roadmap roadmap);
    }
}