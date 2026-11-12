using Projetos___4.Application.DTO.Host;
using Projetos___4.Domain.Model.Host;

namespace Projetos___4.Application.Mapping.Interfaces;

public interface IHostFilterMapping
{
    HostFilter ToModel(HostFilterDTO dto);
}
