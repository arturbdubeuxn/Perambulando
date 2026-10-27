using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;

namespace Projetos___4.Domain.Model
{
    public class User : IdentityUser
    {
        public TypeofUser Typeofuser { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


        public enum TypeofUser
        {
            Local = 0,
            Turist = 1
        }
        
        

        }

    
}
