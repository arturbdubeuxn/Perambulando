using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Repository
{
    public interface IProgrammingRepository
    {
        Task<IEnumerable<Programming>> GetAllProgrammingsbyHostId(int hostId);
        Task<Programming> CreateWithCategoriesAsync(Programming programming, List<ProgrammingXCategory> links);
        Task<Programming?> GetByIdAsync(int id, int? hostId = null);
        Task<Programming> EditAsync(Programming programming);
        Task<Programming> EditWithCategoriesAsync(Programming programming, List<ProgrammingXCategory> linksToAdd, List<int> categoryIdsToRemove);
    }
}
