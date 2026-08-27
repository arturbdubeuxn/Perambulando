using Projetos___4._3___Domain.Model;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
namespace Projetos___4._4___Data.Context
{
    public class Context : IdentityDbContext<IdentityUser>
    {

        public Context(DbContextOptions<Context> options) : base(options)
        {
        }
        //exemplo de criação de tabela no banco de dados; Nome do model + Nome da tabela a ser criada no banco de dados
        public DbSet<Programming> Programmings { get; set; }
    }
}
