using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;

namespace Projetos___4._3___Domain.Model
{
    public class User : IdentityUser
    {
        public string Name { get; set; } = string.Empty;

        public TypeofUser Type { get; set; }


        public enum TypeofUser
        {
            Admin = 0,
            Local = 1,
            Turist = 2,
            Host = 3

        }

    }
}
