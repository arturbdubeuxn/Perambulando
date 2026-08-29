using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;

namespace Projetos___4._3___Domain.Model
{
    public class User : IdentityUser
    {
        public string Name { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        }

    
}
