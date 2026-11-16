using Projetos___4.Domain.Validations.Interface;
using Projetos___4.Application.AppServices;
using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Service
{
    public class RoadmapService : IRoadmapService
    {
        private readonly IRoadmapValidation _roadmapValidation;
        private readonly IRoadmapRepository _roadmapRepository;

        public RoadmapService(IRoadmapValidation roadmapValidation, IRoadmapRepository roadmapRepository)
        {
            _roadmapValidation = roadmapValidation;
            _roadmapRepository = roadmapRepository;
        }
        public async Task<Roadmap> CreateRoadmapAsync(Roadmap roadmap)
        {
            await _roadmapValidation.Validate(roadmap);
            return await _roadmapRepository.CreateRoadmapAsync(roadmap);
        }

        public async Task<bool> DeleteRoadmapAsync(int roadmapId, string userId)
        {
            var roadmap = await _roadmapRepository.GetRoadmapByIdAsync(roadmapId);
            if (string.IsNullOrWhiteSpace(userId) || roadmap.UserId == null || roadmap.UserId != userId)
            {
                throw new UnauthorizedAccessException("Somente o dono pode desativar o roteiro.");
            }
            roadmap.IsActive = false;
            return await _roadmapRepository.DeleteRoadmapAsync(roadmap);
        }

        public async Task<List<Roadmap>> GetAllRoadmapsByUserIdAsync(string userId)
        {
            return await _roadmapRepository.GetAllRoadmapsByUserIdAsync(userId);
        }

        public async Task<Roadmap> GetRoadmapByIdAsync(int roadmapId)
        {
            return await _roadmapRepository.GetRoadmapByIdAsync(roadmapId);
        }

        public async Task<Roadmap> UpdateRoadmapAsync(int roadmapId, Roadmap roadmap, string userId)
        {
            ArgumentNullException.ThrowIfNull(roadmap);
            await _roadmapValidation.Validate(roadmap);
            var obj = await _roadmapRepository.GetRoadmapByIdAsync(roadmapId);
            if(obj == null || string.IsNullOrWhiteSpace(userId) || obj.UserId == null || obj.UserId != userId)
            {
                throw new UnauthorizedAccessException("You are not authorized to update this roadmap.");
            }
            obj.Name = roadmap.Name;
            obj.Description = roadmap.Description;
            obj.UpdatedAt = DateTime.UtcNow;
            obj.roadmapProgrammings.Clear();
            foreach (var stop in roadmap.roadmapProgrammings)
            {
                stop.Roadmap = obj;
                stop.RoadmapId = obj.Id;
                obj.roadmapProgrammings.Add(stop);
            }
            return await _roadmapRepository.UpdateRoadmapAsync(obj);
        }
    }
}




