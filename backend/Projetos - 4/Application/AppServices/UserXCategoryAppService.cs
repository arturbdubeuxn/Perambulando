using Projetos___4.Application.Mapping.Interfaces;
using Microsoft.AspNetCore.Identity;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Application.Validations.Interfaces;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.AppServices
{
    public class UserXCategoryAppService : IUserXCategoryAppService
    {
        private readonly IUserXCategoryService _userXCategoryService;
        private readonly IValidation<UserXCategoryDTO> _userXCategoryValidation;
        private readonly UserManager<User> _userManager;

        private readonly IUserXCategoryMapping _userXCategoryMapping;

        public UserXCategoryAppService(IUserXCategoryService userXCategoryService, IValidation<UserXCategoryDTO> userXCategoryValidation, UserManager<User> userManager, IUserXCategoryMapping userXCategoryMapping)
        {
            _userXCategoryMapping = userXCategoryMapping;
            _userXCategoryService = userXCategoryService;
            _userXCategoryValidation = userXCategoryValidation;
            _userManager = userManager;
        }

        public async Task<UserXCategoryDTO> AddCategoryToUserAsync(List<int> categorysId, string userId)
        {
            var dto = _userXCategoryMapping.ToRequestDTO(categorysId, userId);

            _userXCategoryValidation.Validate(dto, DateTime.UtcNow);

            var links = _userXCategoryMapping.ToModels(dto);

            var savedLinks = await _userXCategoryService.AddAsync(dto.UserId, links);

            return _userXCategoryMapping.ToDTO(savedLinks, dto.UserId);
        }

        public async Task<UserXCategoryDTO> EditCategoryToUserAsync(List<int> categorysId, string userId)
        {
            var dto = _userXCategoryMapping.ToRequestDTO(categorysId, userId);

            _userXCategoryValidation.Validate(dto, DateTime.UtcNow);

            var links = _userXCategoryMapping.ToModels(dto);

            var savedLinks = await _userXCategoryService.EditAsync(dto.UserId, links);

            return _userXCategoryMapping.ToDTO(savedLinks, dto.UserId);
        }
    }
}
