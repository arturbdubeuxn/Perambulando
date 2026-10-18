using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Service
{
    public interface IProgrammingService
    {
        Task<Programming?> GetByIdAsync(int programmingId);
        Task<List<Category>> GetAllCategoriesbyProgrammingId(int programmingId);
        Task<Programming?> DeleteProgrammingAsync(int id, int hostId, string userId);
        Task<IEnumerable<Programming>> GetAllProgrammingsbyHostId(int hostId, string userId);
        Task<IEnumerable<Programming>> GetAllProgrammingsbyHostId(int hostId);
        Task<Programming> CreateProgrammingAsync(Programming programming, List<ProgrammingXCategory> links, string userId);
        Task<Programming?> EditProgrammingAsync(Programming programming, List<ProgrammingXCategory> links, string userId);
    }
}
