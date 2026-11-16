using Projetos___4.Domain.Model;

namespace Projetos___4.Application.AppServices
{
    public interface IRoadmapService
    {
        Task<List<Roadmap>> GetAllRoadmapsByUserIdAsync(string userId);

        Task<Roadmap> GetRoadmapByIdAsync(int roadmapId);

        Task<Roadmap> CreateRoadmapAsync(Roadmap roadmap);

        Task<Roadmap> UpdateRoadmapAsync(int roadmapId, Roadmap roadmap, string userId);

        Task<bool> DeleteRoadmapAsync(int roadmapId, string userId);


    }
}
