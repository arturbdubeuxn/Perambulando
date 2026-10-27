using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Mapping.Interfaces;

public interface IHostFilterMapping
{
    HostFilter ToModel(HostFilterDTO dto);
}
