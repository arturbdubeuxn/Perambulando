using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Interfaces
{
    public interface IProgrammingXCategoryAppService
    {
        List<ProgrammingXCategory> CreateProgrammingLinks(Programming programming, List<int> categoriesIds);
    }
}
