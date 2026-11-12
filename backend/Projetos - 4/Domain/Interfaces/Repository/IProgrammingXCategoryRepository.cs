using Projetos___4.Domain.Model.Programming;

namespace Projetos___4.Domain.Interfaces.Repository
{
    public interface IProgrammingXCategoryRepository
    {
        Task<List<ProgrammingXCategory>> GetAllByProgrammingIdAsync(int programmingId);

    }
}
