using Microsoft.AspNetCore.Http.HttpResults;
using Projetos___4.Domain.Interfaces;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Validations.Interface;

namespace Projetos___4.Domain.Service
{
    public class ProgrammingService : IProgrammingService
    {
        private readonly IProgrammingRepository _programmingRepository;
        private readonly IUserRepository _userRepository;
        private readonly IHostRepository _hostRepository;
        private readonly IAddressService _addressService;
        private readonly ICategoryRepository _categoryRepository;
        private readonly ICategoryService _categoryService;
        private readonly IProgrammingXCategoryService _programmingXCategoryService;


        public ProgrammingService(IProgrammingRepository programmingRepository, IUserRepository userRepository, IHostRepository hostRepository, ICategoryRepository categoryRepository, IAddressService addressService,
ICategoryService categoryService, IProgrammingXCategoryService programmingXCategoryService)
        {
            _programmingRepository = programmingRepository;
            _userRepository = userRepository;
            _hostRepository = hostRepository;
            _addressService = addressService;
            _categoryRepository = categoryRepository;
            _categoryService = categoryService;
            _programmingXCategoryService = programmingXCategoryService;
        }
        public Task<List<Programming>> GetAllProgrammingsAsync(int take, int skip)
        {
            if (take <= 0)
            {
                throw new ArgumentException("Take deve ser maior que zero.", nameof(take));
            }

            if (skip < 0)
            {
                throw new ArgumentException("Skip deve ser maior ou igual a zero.", nameof(skip));
            }

            return _programmingRepository.GetAllProgrammingsAsync(take, skip);
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

        public async Task<IEnumerable<Programming>> GetAllProgrammingsbyHostId(int hostId)
        {
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

            var addressId = programming.AddressId > 0 ? programming.AddressId : programming.Address?.Id ?? 0;
            var newAddress = addressId > 0 ? null : programming.Address;
            var address = await _addressService.AddAddress(addressId, newAddress, userId);

            var currentCategories = await _categoryRepository.GetAllCategoriesbyProgrammingId(existing.Id);
            var currentLinks = await _programmingXCategoryService.GetAllByProgrammingIdAsync(existing.Id);
            var categoryIdsToRemove = _categoryService.GetCategoryIdsToRemove(currentCategories, links);
            var linksToAdd = _programmingXCategoryService.GetLinksToAdd(currentCategories, links);

            existing.Name = programming.Name;
            existing.Description = programming.Description;
            existing.StartDate = programming.StartDate;
            existing.EndDate = programming.EndDate;
            existing.IsFree = programming.IsFree;
            existing.Address = address;
            existing.AddressId = address.Id;
            existing.ImageUrl = programming.ImageUrl;
            existing.TicketUrl = programming.TicketUrl;
            existing.InstagranUrl = programming.InstagranUrl;
            existing.MinPrice = programming.MinPrice;
            existing.MaxPrice = programming.MaxPrice;
            existing.UpdateDate = DateTime.UtcNow;

            var edited = await _programmingRepository.EditWithCategoriesAsync(existing, linksToAdd, categoryIdsToRemove, currentLinks);
            return edited;
        }

        public async Task<Programming> CreateProgrammingAsync(Programming programming, List<ProgrammingXCategory> links, string userId)
        {
           if (programming.StartDate <= DateTime.UtcNow)
           {
               throw new ArgumentException("A data de início deve ser posterior à data atual.");
           }

           if (string.IsNullOrWhiteSpace(userId))
           {
               throw new InvalidOperationException("Esse usuário não é o dono do host ativo para este programa.");
           }

           bool userOwnsActiveHost = await _hostRepository.UserOwnsActiveHostAsync(programming, userId);

           if (!userOwnsActiveHost)
           {
                throw new InvalidOperationException("Esse usuário não é o dono do host ativo para este programa.");
           }

           var addressId = programming.AddressId > 0 ? programming.AddressId : programming.Address?.Id ?? 0;
           var newAddress = addressId > 0 ? null : programming.Address;
           programming.Address = await _addressService.AddAddress(addressId, newAddress, userId);
           programming.AddressId = programming.Address.Id;

           return await _programmingRepository.CreateWithCategoriesAsync(programming, links);
        }

        public async Task<List<Programming>> GetAllProgrammingsByUserCategories(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return new List<Programming>();
            }

            IEnumerable<Category> userCategories = await _categoryRepository.GetAllCategoriesbyUserId(userId);

            List<int> userCategoryIds = userCategories.Select(c => c.Id).ToList();

            if (userCategories == null)
            {
                return new List<Programming>();
            }

            List<Programming> programmings = await _programmingRepository.GetAllProgrammingsByUserCategories(userCategoryIds);

            if (programmings == null || programmings.Count == 0)
            {
                return new List<Programming>();
            }


            return programmings;
        }

        public async Task<List<Programming>> FilterAsync(ProgrammingFilter programmingFilter)
        {
            return await _programmingRepository.FilterAsync(programmingFilter);
        }
    }
}
