using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Projetos___4._3___Domain.Model;
using Projetos___4._4___Data.Context;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddDbContext<Context>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services
    .AddIdentity<User, IdentityRole>()
    .AddEntityFrameworkStores<Context>()
    .AddDefaultTokenProviders();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    await using var scope = app.Services.CreateAsyncScope();
    var context = scope.ServiceProvider.GetRequiredService<Context>();

    if (!context.Database.GetMigrations().Any())
    {
        throw new InvalidOperationException(
            "No EF Core migrations were found. Create the initial migration with " +
            "`dotnet ef migrations add InitialCreate --output-dir \"4 - Data/Migrations\"`.");
    }

    await context.Database.MigrateAsync();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
