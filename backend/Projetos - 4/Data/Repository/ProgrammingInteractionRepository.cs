using Microsoft.EntityFrameworkCore;
using Npgsql;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Repository;

public class ProgrammingInteractionRepository : IProgrammingInteractionRepository
{
    private readonly Context.Context Db;

    public ProgrammingInteractionRepository(Context.Context context)
    {
        Db = context;
    }

    public async Task<ProgrammingInteraction> AddAsync(ProgrammingInteraction interaction)
    {
        Db.ProgrammingInteractions.Add(interaction);
        try
        {
            await Db.SaveChangesAsync();
            return interaction;
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException postgres &&
            postgres.SqlState == PostgresErrorCodes.UniqueViolation &&
            postgres.ConstraintName == "IX_ProgrammingInteractions_EventId")
        {
            Db.Entry(interaction).State = EntityState.Detached;
            var existing = await GetByEventIdAsync(interaction.EventId);
            if (existing == null)
            {
                throw;
            }

            return existing;
        }
    }

    public async Task<ProgrammingInteraction?> GetByEventIdAsync(Guid eventId)
    {
        return await Db.ProgrammingInteractions.AsNoTracking()
            .FirstOrDefaultAsync(interaction => interaction.EventId == eventId);
    }
}
