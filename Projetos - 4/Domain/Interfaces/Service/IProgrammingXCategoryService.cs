using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Service
{
    public interface IProgrammingXCategoryService
    {
        List<ProgrammingXCategory> GetLinksToAdd(List<Category> currentCategories, List<ProgrammingXCategory> links);

        Task<ProgrammingXCategory> CreateProgrammingXCategoryAsync(ProgrammingXCategory programmingXCategory);
    }
}
