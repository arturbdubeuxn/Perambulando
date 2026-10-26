using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Interfaces
{
    public interface IProgrammingXCategoryAppService
    {
        Task<ProgrammingXCategoryResponseDTO> CreateProgrammingXCategoryAsync(int categoryId, int programmingId);

        List<ProgrammingXCategory> CreateProgrammingLinks(Programming programming, List<int> categoriesIds);
    }
}
