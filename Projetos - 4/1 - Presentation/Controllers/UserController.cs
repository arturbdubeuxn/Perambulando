using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Projetos___4._1___Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class USerController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok("Hello from the Host Controller!");
        }

        [HttpGet("Artur")]
        public IActionResult GetHostName()
        {
            return Ok("Host Name: Artur");
        }

        [HttpGet("Artur/Details")]
        public IActionResult GetHostDetails()
        {
            return Ok("Host Details: Artur, Age: 30, Location: Earth");
        }

        [HttpPatch("Artur/Update")]
        public IActionResult UpdateHostDetails([FromBody] HostDetails updatedDetails)
        {
            // Here you would typically update the host details in your database or service
            // For demonstration purposes, we'll just return the updated details
            return Ok($"Updated Host Details: Name: {updatedDetails.Name}, Age: {updatedDetails.Age}, Location: {updatedDetails.Location}");
        }
    }
}
