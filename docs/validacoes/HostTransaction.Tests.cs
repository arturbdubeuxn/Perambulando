using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Projetos___4.Data.Repository;
using Projetos___4.Domain.Interfaces;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Service;
using Context = Projetos___4.Data.Context.Context;

var count = 0;
void Check(bool condition, string message)
{
    if (!condition) { throw new Exception(message); }
    count++;
    Console.WriteLine("PASS: " + message);
}
foreach (var scenario in new[] { "success", "existing-role", "identity-failure", "reused-address-failure", "after-role-write", "host-write-failure", "missing-role" })
{
    await using var connection = new SqliteConnection("Data Source=:memory:;Foreign Keys=True");
    await connection.OpenAsync();
    var audit = new SaveAudit();
    var reject = new RejectUserUpdate();
    var services = new ServiceCollection();
    services.AddLogging();
    services.AddScoped<Context>(_ => new TestContext(new DbContextOptionsBuilder<Context>().UseSqlite(connection).AddInterceptors(audit).Options));
    services.AddIdentityCore<User>().AddRoles<IdentityRole>().AddEntityFrameworkStores<Context>();
    services.AddSingleton<IUserValidator<User>>(reject);
    services.AddScoped<IUserRepository, UserRepository>();
    services.AddScoped<IHostRepository, HostRepository>();
    services.AddScoped<IAddressService, TestAddressService>();
    services.AddScoped<HostService>();
    await using var provider = services.BuildServiceProvider();
    await using var scope = provider.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<Context>();
    await db.Database.EnsureCreatedAsync();
    var users = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var user = new User { Id = "test-user", UserName = "test-user" };
    Check((await users.CreateAsync(user)).Succeeded, scenario + ": seed user");
    if (scenario != "missing-role") { Check((await roles.CreateAsync(new IdentityRole("HOST"))).Succeeded, "Seed HOST role"); }
    if (scenario == "existing-role") { Check((await users.AddToRoleAsync(user, "HOST")).Succeeded, "Seed existing membership"); }
    var address = new Address { Street = "Test", Number = "1", CEP = "50000000", AddWho = user.Id };
    if (scenario == "reused-address-failure")
    {
        db.Addresses.Add(address);
        await db.SaveChangesAsync();
    }
    var host = new Hosts { Name = "Test host", Address = address, AddressId = address.Id, UserId = user.Id };
    var store = scope.ServiceProvider.GetRequiredService<IUserStore<User>>();
    var storeContext = store.GetType().GetProperty("Context")!.GetValue(store);
    Check(ReferenceEquals(storeContext, db), "Identity uses the same scoped Context");
    var repo = scope.ServiceProvider.GetRequiredService<IHostRepository>();
    var repoContext = typeof(HostRepository).GetField("Db", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)!.GetValue(repo);
    Check(ReferenceEquals(repoContext, storeContext), "Repository and Identity share context and connection");
    audit.Transactions.Clear();
    reject.Enabled = scenario is "identity-failure" or "reused-address-failure";
    var failed = false;
    try
    {
        if (scenario == "after-role-write")
        {
            await repo.Create(host, async () =>
            {
                Check((await users.AddToRoleAsync(user, "HOST")).Succeeded, "Identity role write succeeds before forced failure");
                throw new InvalidOperationException("Forced failure after Identity saved");
            });
        }
        else if (scenario == "host-write-failure")
        {
            host.UserId = "nonexistent-user";
            await repo.Create(host, () => throw new Exception("Role callback must not run"));
        }
        else
        {
            var result = await scope.ServiceProvider.GetRequiredService<HostService>().Create(host, user.Id);
            Check(result != null && result.Id > 0, "Host receives generated ID");
        }
    }
    catch (InvalidOperationException ex) when (ex.Message is "Host role assignment failed." or "Forced failure after Identity saved" or "Role HOST is not registered.") { failed = true; }
    catch (DbUpdateException) when (scenario == "host-write-failure") { failed = true; }
    var expectedFailure = scenario is not ("success" or "existing-role");
    Check(failed == expectedFailure, scenario + ": expected outcome");
    if (expectedFailure && scenario != "missing-role") { Check(!db.ChangeTracker.Entries().Any(), "Rollback removes stale tracked changes"); }
    db.ChangeTracker.Clear();
    Check(await db.Hosts.CountAsync() == (expectedFailure ? 0 : 1), scenario + ": correct persisted host count");
    Check(await db.UserRoles.CountAsync() == (expectedFailure ? 0 : 1), scenario + ": correct persisted role membership count");
    Check(await db.Addresses.CountAsync() == (!expectedFailure || scenario == "reused-address-failure" ? 1 : 0), scenario + ": new address rolled back or existing address preserved");
    Check(db.Database.CurrentTransaction == null, "Transaction disposed");
    Check(audit.Transactions.All(id => id.HasValue) && audit.Transactions.Distinct().Count() <= 1, "All writes belong to the same transaction");
    if (scenario == "success") { Check(audit.Transactions.Count == 2, "Both host and Identity SaveChanges participate"); }
    if (scenario == "existing-role") { Check(audit.Transactions.Count == 1, "Existing HOST role is preserved without duplicate assignment"); }
}
Console.WriteLine($"Total: {count} checks passed. SQLite in memory; no application database accessed.");

public class TestContext(DbContextOptions<Context> options) : Context(options)
{
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<Address>().Ignore(address => address.Location);
    }
}
public class SaveAudit : SaveChangesInterceptor
{
    public List<Guid?> Transactions { get; } = [];
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData data, InterceptionResult<int> result, CancellationToken token = default)
    {
        Transactions.Add(data.Context!.Database.CurrentTransaction?.TransactionId);
        return ValueTask.FromResult(result);
    }
}
public class RejectUserUpdate : IUserValidator<User>
{
    public bool Enabled { get; set; }
    public Task<IdentityResult> ValidateAsync(UserManager<User> manager, User user) => Task.FromResult(Enabled ? IdentityResult.Failed(new IdentityError { Description = "Forced Identity failure" }) : IdentityResult.Success);
}
public class TestAddressService(Context db) : IAddressService
{
    public Task<Address> AddAddress(int id, Address? address, string userId)
    {
        if (db.Database.CurrentTransaction != null) { throw new Exception("Address preparation must happen before transaction"); }
        return Task.FromResult(address!);
    }
    public Task<Address?> GetByIdAsync(int id) => throw new NotSupportedException();
    public Task<List<Address>> GetAllAddressAsync(string search) => throw new NotSupportedException();
}
