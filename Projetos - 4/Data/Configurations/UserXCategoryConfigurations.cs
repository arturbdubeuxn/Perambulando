using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Configurations
{
    public class UserXCategoryConfigurations : IEntityTypeConfiguration<UserXCategory>
    {
            public void Configure(EntityTypeBuilder<UserXCategory> builder)
            {
                builder.ToTable("UserXCategories");

            }
        
    }
}
