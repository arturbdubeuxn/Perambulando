using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Service
{
    public interface IProgrammingXCategoryService
    {
        Task<List<ProgrammingXCategory>> GetAllByProgrammingIdAsync(int programmingId);

        List<ProgrammingXCategory> GetLinksToAdd(List<Category> currentCategories, List<ProgrammingXCategory> links);

    }
}
