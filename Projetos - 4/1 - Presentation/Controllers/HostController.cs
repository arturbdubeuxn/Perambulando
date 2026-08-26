using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Projetos___4._1___Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HostController : ControllerBase
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
    }
}
