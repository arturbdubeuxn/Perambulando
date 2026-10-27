using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Repository
{
    public interface IProgrammingRepository
    {
        Task<List<Programming>> GetAllProgrammingsAsync(int take, int skip);
        Task<IEnumerable<Programming>> GetAllProgrammingsbyHostId(int hostId);
        Task<Programming> CreateWithCategoriesAsync(Programming programming, List<ProgrammingXCategory> links);
        Task<Programming?> GetByIdAsync(int id, int? hostId = null);
        Task<Programming> EditAsync(Programming programming);
        Task<Programming> EditWithCategoriesAsync(Programming programming, List<ProgrammingXCategory> linksToAdd, List<int> categoryIdsToRemove, List<ProgrammingXCategory>currentLinks);
        Task<List<Programming>> GetAllProgrammingsByUserCategories(List<int> categoryIds);
        Task<List<Programming>> FilterAsync(ProgrammingFilter programmingFilter);
        Task<List<Programming>> GetAllProgrammingsWithProHost(int take, int skip);
    }
}
