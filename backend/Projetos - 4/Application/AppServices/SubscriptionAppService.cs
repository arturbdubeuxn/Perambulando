using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Interfaces.Service;
namespace Projetos___4.Application.AppServices;
public class SubscriptionAppService : ISubscriptionAppService
{
    private readonly ISubscriptionService _service;
    private readonly ISubscriptionMapping _mapping;
    public SubscriptionAppService(ISubscriptionService service, ISubscriptionMapping mapping)
    { _service = service; _mapping = mapping; }
    public async Task<SubscriptionResponseDTO> GetAsync(string userId)
    {
        return _mapping.ToDTO(await _service.GetAsync(userId));
    }
    public async Task<SubscriptionResponseDTO> ActivateAsync(string userId)
    {
        var subscription = _mapping.ToModel(userId);
        var result = await _service.ActivateAsync(subscription);
        return _mapping.ToDTO(result);
    }
    public async Task<SubscriptionResponseDTO> CancelAsync(string userId)
    {
       return  _mapping.ToDTO(await _service.CancelAsync(userId));
    }
}
