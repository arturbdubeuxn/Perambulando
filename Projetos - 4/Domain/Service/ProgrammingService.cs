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
        private readonly IGeocodingService _geocodingService;
        private readonly ICategoryRepository _categoryRepository;

        public ProgrammingService(IProgrammingRepository programmingRepository, IUserRepository userRepository, IHostRepository hostRepository, ICategoryRepository categoryRepository, IGeocodingService geocodingService)
        {
            _programmingRepository = programmingRepository;
            _userRepository = userRepository;
            _hostRepository = hostRepository;
            _geocodingService = geocodingService;
            _categoryRepository = categoryRepository;
        }
        public Task<Programming?> GetByIdAsync(int programmingId)
        {
            return _programmingRepository.GetByIdAsync(programmingId);
        }

        public Task<List<Category>> GetAllCategoriesbyProgrammingId(int programmingId)
        {
            return _categoryRepository.GetAllCategoriesbyProgrammingId(programmingId);
        }

        public async Task<Programming?> DeleteProgrammingAsync(int id, int hostId, string userId)
        {
            if (string.IsNullOrWhiteSpace(userId) ||
                !await _hostRepository.UserOwnsActiveHostAsync(new Programming { HostId = hostId }, userId))
            {
                return null;
            }

            var programming = await _programmingRepository.GetByIdAsync(id, hostId);
            if (programming == null)
                return null;

            if (programming.IsActive)
            {
                programming.IsActive = false;
                programming.UpdateDate = DateTime.UtcNow;
                await _programmingRepository.EditAsync(programming);
            }

            return programming;
        }

        public Task<IEnumerable<Programming>> GetAllProgrammingsbyHostId(int hostId)
        {
            return _programmingRepository.GetAllProgrammingsbyHostId(hostId);
        }

        public async Task<IEnumerable<Programming>> GetAllProgrammingsbyHostId(int hostId, string userId)
        {
            if (string.IsNullOrWhiteSpace(userId) ||
                !await _hostRepository.UserOwnsActiveHostAsync(new Programming { HostId = hostId }, userId))
            {
                return Enumerable.Empty<Programming>();
            }

            var programmings = await _programmingRepository.GetAllProgrammingsbyHostId(hostId);
            return programmings;
        }

        public async Task<Programming?> EditProgrammingAsync(Programming programming, List<ProgrammingXCategory> links, string userId)
        {
            if (string.IsNullOrWhiteSpace(userId) ||
                !await _hostRepository.UserOwnsActiveHostAsync(programming, userId))
            {
                return null;
            }

            var existing = await _programmingRepository.GetByIdAsync(programming.Id, programming.HostId);
            if (existing == null)
            {
                return null;
            }

            var address = new GeocodingAddress(programming.Address, programming.AddressNumber, programming.Neighborhood, programming.CEP);
            var currentAddress = new GeocodingAddress(existing.Address, existing.AddressNumber, existing.Neighborhood, existing.CEP);
            var location = existing.Location;
            if (location == null || address != currentAddress)
            {
                location = await _geocodingService.GeocodeAsync(address);
            }

            var currentCategories = await _categoryRepository.GetAllCategoriesbyProgrammingId(existing.Id);
            var currentCategoryIds = currentCategories.Select(category => category.Id).ToHashSet();
            var desiredCategoryIds = links.Select(link => link.CategoryId).ToHashSet();
            var categoryIdsToRemove = currentCategoryIds.Except(desiredCategoryIds).ToList();
            var linksToAdd = links.Where(link => !currentCategoryIds.Contains(link.CategoryId)).ToList();

            existing.Name = programming.Name;
            existing.Description = programming.Description;
            existing.StartDate = programming.StartDate;
            existing.EndDate = programming.EndDate;
            existing.IsFree = programming.IsFree;
            existing.Address = programming.Address;
            existing.AddressNumber = programming.AddressNumber;
            existing.AddressComplement = programming.AddressComplement;
            existing.Neighborhood = programming.Neighborhood;
            existing.CEP = programming.CEP;
            existing.Location = location;
            existing.ImageUrl = programming.ImageUrl;
            existing.TicketUrl = programming.TicketUrl;
            existing.InstagranUrl = programming.InstagranUrl;
            existing.MinPrice = programming.MinPrice;
            existing.MaxPrice = programming.MaxPrice;
            existing.UpdateDate = DateTime.UtcNow;

            var edited = await _programmingRepository.EditWithCategoriesAsync(existing, linksToAdd, categoryIdsToRemove);
            return edited;
        }

        public async Task<Programming> CreateProgrammingAsync(Programming programming, List<ProgrammingXCategory> links, string userId)
        {
           bool userOwnsActiveHost = await _hostRepository.UserOwnsActiveHostAsync(programming, userId);

           if (!userOwnsActiveHost)
           {
                throw new InvalidOperationException("Esse usuário não é o dono do host ativo para este programa.");
           }

           programming.Location = await _geocodingService.GeocodeAsync(new GeocodingAddress(programming.Address, programming.AddressNumber, programming.Neighborhood, programming.CEP));

           return await _programmingRepository.CreateWithCategoriesAsync(programming, links);
        }
    }
}
