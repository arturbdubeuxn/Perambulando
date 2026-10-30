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
       
        await Db.SaveChangesAsync();
        return interaction;
        
    }

    public async Task<ProgrammingInteraction?> GetByEventIdAsync(Guid eventId)
    {
        return await Db.ProgrammingInteractions.AsNoTracking()
            .FirstOrDefaultAsync(interaction => interaction.EventId == eventId);
    }
}
