using Microsoft.AspNetCore.Http.HttpResults;
using Projetos___4.Domain.Interfaces;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Service
{
    public class ProgrammingService : IProgrammingService
    {
        private readonly IProgrammingRepository _programmingRepository;
        private readonly IUserRepository _userRepository;
        private readonly IHostRepository _hostRepository;

        public ProgrammingService(IProgrammingRepository programmingRepository, IUserRepository userRepository, IHostRepository hostRepository)
        {
            _programmingRepository = programmingRepository;
            _userRepository = userRepository;
            _hostRepository = hostRepository;
        }
        public Task<Programming?> GetByIdAsync(int programmingId)
        {
            return _programmingRepository.GetByIdAsync(programmingId);
        }

        public async Task<OperationResult<Programming>> DeleteProgrammingAsync(int id, int hostId, string userId)
        {
            if (string.IsNullOrWhiteSpace(userId) ||
                !await _hostRepository.UserOwnsActiveHostAsync(new Programming { HostId = hostId }, userId))
            {
                return new(false, null, "Programação não encontrada ou indisponível.");
            }

            var programming = await _programmingRepository.GetByIdAsync(id, hostId);
            if (programming == null)
                return new(false, null, "Programação não encontrada ou indisponível.");

            if (programming.IsActive)
            {
                programming.IsActive = false;
                programming.UpdateDate = DateTime.UtcNow;
                await _programmingRepository.EditAsync(programming);
            }

            return new(true, programming, "Programação desativada com sucesso.");
        }

        public async Task<OperationResult<IEnumerable<Programming>>> GetAllProgrammingsbyHostId(int hostId, string userId)
        {
            if (string.IsNullOrWhiteSpace(userId) ||
                !await _hostRepository.UserOwnsActiveHostAsync(new Programming { HostId = hostId }, userId))
            {
                return new(false, null, "Host não encontrado ou indisponível.");
            }

            var programmings = await _programmingRepository.GetAllProgrammingsbyHostId(hostId);
            return new(true, programmings, "Programações consultadas com sucesso.");
        }

        public async Task<OperationResult<Programming>> EditProgrammingAsync(Programming programming, string userId)
        {
            if (string.IsNullOrWhiteSpace(userId) ||
                !await _hostRepository.UserOwnsActiveHostAsync(programming, userId))
            {
                return new(false, null, "Programação não encontrada ou indisponível.");
            }

            var existing = await _programmingRepository.GetByIdAsync(programming.Id, programming.HostId);
            if (existing == null)
                return new(false, null, "Programação não encontrada ou indisponível.");

            existing.Name = programming.Name;
            existing.Description = programming.Description;
            existing.StartDate = programming.StartDate;
            existing.EndDate = programming.EndDate;
            existing.IsFree = programming.IsFree;
            existing.Address = programming.Address;
            existing.Neighborhood = programming.Neighborhood;
            existing.CEP = programming.CEP;
            existing.ImageUrl = programming.ImageUrl;
            existing.TicketUrl = programming.TicketUrl;
            existing.InstagranUrl = programming.InstagranUrl;
            existing.MinPrice = programming.MinPrice;
            existing.MaxPrice = programming.MaxPrice;
            existing.UpdateDate = DateTime.UtcNow;

            var edited = await _programmingRepository.EditAsync(existing);
            return new(true, edited, "Programação atualizada com sucesso.");
        }

        public async Task<Programming> CreateProgrammingAsync(Programming programming, List<ProgrammingXCategory> links, string userId)
        {
           bool userOwnsActiveHost = await _hostRepository.UserOwnsActiveHostAsync(programming, userId);

           if (!userOwnsActiveHost)
           {
                throw new InvalidOperationException("Esse usuário não é o dono do host ativo para este programa.");
           }

           return await _programmingRepository.CreateWithCategoriesAsync(programming, links);
        }
    }
}
