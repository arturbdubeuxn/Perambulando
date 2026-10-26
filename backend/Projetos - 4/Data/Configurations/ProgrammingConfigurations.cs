using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Configurations;

public class ProgrammingConfigurations : IEntityTypeConfiguration<Programming>
{
    public void Configure(EntityTypeBuilder<Programming> builder)
    {

    }
}
