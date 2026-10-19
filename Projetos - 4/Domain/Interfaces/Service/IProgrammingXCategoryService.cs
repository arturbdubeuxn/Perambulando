using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Service
{
    public interface IProgrammingXCategoryService
    {
        Task<ProgrammingXCategory> CreateProgrammingXCategoryAsync(ProgrammingXCategory programmingXCategory);
    }
}
