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
        var subscription = await _service.GetAsync(userId);
        return _mapping.ToDTO(subscription, _service.GetStatus(subscription));
    }
    public async Task<SubscriptionResponseDTO> ActivateAsync(string userId)
    {
        var subscription = _mapping.ToModel(userId);
        var result = await _service.ActivateAsync(subscription);
        return _mapping.ToDTO(result, _service.GetStatus(result));
    }
    public async Task<SubscriptionResponseDTO> CancelAsync(string userId)
    {
        var subscription = await _service.CancelAsync(userId);
        return _mapping.ToDTO(subscription, _service.GetStatus(subscription));
    }
}
