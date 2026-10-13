using Projetos___4._2___Application.DTO;
using Projetos___4.Application.AppServices;

namespace Projetos___4.Application.Interfaces
{
    public interface IHostAppService
    {

        Task<OperationResult<HostRegisterDTO>> Create(HostRegisterDTO dto, string userId);


    }
}
