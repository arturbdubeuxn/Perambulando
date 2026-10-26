using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.AppServices
{
    public class ProgrammingXCategoryAppService : IProgrammingXCategoryAppService
    {

        private readonly IProgrammingXCategoryMapping _programmingXCategoryMapping;

        public ProgrammingXCategoryAppService(IProgrammingXCategoryMapping programmingXCategoryMapping)
        {
            _programmingXCategoryMapping = programmingXCategoryMapping;
        }
        public List<ProgrammingXCategory> CreateProgrammingLinks(Programming programming, List<int> categoriesIds)
        {
            var links = new List<ProgrammingXCategory>();
            foreach (var categoryId in categoriesIds)
            {
                links.Add(_programmingXCategoryMapping.ToModel(categoryId, programming));
            }

            return links;
        }

    }
}
