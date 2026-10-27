using Projetos___4.Application.DTO;
namespace Projetos___4.Application.Interfaces;
public interface ISubscriptionAppService
{
    Task<SubscriptionResponseDTO> GetAsync(string userId);
    Task<SubscriptionResponseDTO> ActivateAsync(string userId);
    Task<SubscriptionResponseDTO> CancelAsync(string userId);
}
