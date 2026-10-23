using Projetos___4.Application.DTO;

namespace Projetos___4.Application.Interfaces
{
    public interface IProgrammingXCategoryAppService
    {
        Task<ProgrammingXCategoryResponseDTO> CreateProgrammingXCategoryAsync(int categoryId, int programmingId);
    }
}
