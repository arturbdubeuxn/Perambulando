using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Service;

namespace Projetos___4.Domain.Interfaces.Service
{
    public interface IProgrammingService
    {
        Task<List<Programming>> GetAllProgrammingsAsync(int take, int skip);
        Task<Programming?> GetByIdAsync(int programmingId);
        Task<List<Category>> GetAllCategoriesbyProgrammingId(int programmingId);
        Task<Programming?> DeleteProgrammingAsync(int id, int hostId, string userId);
        Task<IEnumerable<Programming>> GetAllProgrammingsbyHostId(int hostId);
        Task<List<Programming>> GetAllProgrammingsByUserCategories(string userId);
        Task<Programming> CreateProgrammingAsync(Programming programming, List<ProgrammingXCategory> links, string userId);
        Task<Programming?> EditProgrammingAsync(Programming programming, List<ProgrammingXCategory> links, string userId);
        Task<List<Programming>> FilterAsync(ProgrammingFilter programmingFilter);
        Task<List<Programming>> GetAllProgrammingsWithProHost(int take, int skip);
       
    }
}
