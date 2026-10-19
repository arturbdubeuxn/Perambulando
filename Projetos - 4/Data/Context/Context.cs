using Projetos___4.Domain.Model;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
namespace Projetos___4.Data.Context
{
    public class Context : IdentityDbContext<User>
    {

        public Context(DbContextOptions<Context> options) : base(options)
        {
        }

        public DbSet<Category> Categories => Set<Category>();

        public DbSet<Hosts> Hosts => Set<Hosts>();

        public DbSet<Programming> Programmings => Set<Programming>();

        public DbSet<ProgrammingXCategory> ProgrammingXCategories => Set<ProgrammingXCategory>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(Context).Assembly);
        }
    
    }
}
