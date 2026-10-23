using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Projetos___4.Application.AppServices;
using Projetos___4.Application.Interfaces;
using Projetos___4.Application.Validations.Interfaces;
using Projetos___4.Application.Validations.Validations.Programming;
using Projetos___4.Data.Context;
using Projetos___4.Data.Repository;
using Projetos___4.Data.Services;
using Projetos___4.Domain.Interfaces;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Service;
using System.Text;
using static System.Net.Mime.MediaTypeNames;

using Projetos___4.Application.DTO;
using Projetos___4.Application.Validations.Validations.User;
using Projetos___4.Application.Validations.Validations.Host;
using Projetos___4.Domain.Validations.Interface;
using Projetos___4.Domain.Validations.Validations;



var builder = WebApplication.CreateBuilder(args);
if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddJsonFile("appsettings.json", optional: true, reloadOnChange: false);
    builder.Configuration.AddEnvironmentVariables();
    builder.Configuration.AddCommandLine(args);
}


builder.Services.AddControllers();

builder.Services.AddDbContext<Context>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsql => npgsql.UseNetTopologySuite()));
builder.Services
    .AddIdentity<User, IdentityRole>()
    .AddEntityFrameworkStores<Context>()
    .AddDefaultTokenProviders();


builder.Services.Configure<IdentityOptions>(options =>
{
    options.User.RequireUniqueEmail = true;
    options.ClaimsIdentity.UserIdClaimType = "sub";
    options.ClaimsIdentity.UserNameClaimType = "name";
    options.ClaimsIdentity.RoleClaimType = "role";
});

// A chave é fornecida por Geoapify__ApiKey. Não registrar URLs que contêm a chave.
builder.Services.Configure<GeoapifyOptions>(builder.Configuration.GetSection("Geoapify"));
builder.Services.AddHttpClient<IGeocodingService, GeoapifyGeocodingService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
}).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler { AllowAutoRedirect = false })
  .RemoveAllLoggers();

// INJEÇÃO DE DEPENDÊNCIAS
builder.Services.AddScoped<IAddressRepository, AddressRepository>();
builder.Services.AddScoped<IAddressService, AddressService>();
builder.Services.AddScoped<IAddressAppService, AddressAppService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IUserAppService, UserAppService>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<IHostAppService,HostAppService>();
builder.Services.AddScoped<IHostService,HostService>();
builder.Services.AddScoped<IHostRepository,HostRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProgrammingRepository,ProgrammingRepository>();
builder.Services.AddScoped<IProgrammingService, ProgrammingService>();
builder.Services.AddScoped<IProgrammingValidations, ProgrammingValidations>();
builder.Services.AddScoped<IProgrammingXCategoryRepository, ProgrammingXCategoryRepository>();
builder.Services.AddScoped<IProgrammingXCategoryService, ProgrammingXCategoryService>();
builder.Services.AddScoped<IProgrammingAppService, ProgrammingAppService>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ICategoryAppService, CategoryAppService>();
builder.Services.AddScoped<IUserXCategoryRepository, UserXCategoryRepository>();
builder.Services.AddScoped<IUserXCategoryService, UserXCategoryService>();
builder.Services.AddScoped<IUserXCategoryAppService, UserXCategoryAppService>();
builder.Services.AddScoped<IValidation<ProgrammingCreateDTO>, ProgrammingCreateValidation>();
builder.Services.AddScoped<IValidation<ProgrammingEditDTO>, ProgrammingEditValidation>();
builder.Services.AddScoped<IValidation<HostRegisterDTO>, HostCreateValidation>();
builder.Services.AddScoped<IValidation<HostEditDTO>, HostEditValidation>();
builder.Services.AddScoped<IValidation<UserRegisterDTO>, UserCreateValidation>();
builder.Services.AddScoped<IValidation<UserEditDTO>, UserEditValidation>();
builder.Services.AddScoped<IValidation<UserXCategoryDTO>, UserXCategoryValidation>();


///

// 8. Validação da configuração JWT
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32)
    throw new InvalidOperationException("Configure Jwt:Key with at least 32 bytes using the Jwt__Key environment variable.");
if (string.IsNullOrWhiteSpace(builder.Configuration["Jwt:Issuer"]) ||
    string.IsNullOrWhiteSpace(builder.Configuration["Jwt:Audience"]) ||
    builder.Configuration.GetValue<int>("Jwt:ExpirationHours") <= 0)
    throw new InvalidOperationException("Configure Jwt:Issuer, Jwt:Audience and a positive Jwt:ExpirationHours.");

// 9. Autenticação JWT
builder.Services.AddAuthentication(options =>
{ 
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        NameClaimType = "name",
        RoleClaimType = "role",
        ValidateIssuer = true,        
        ValidateAudience = true,         
        ValidateLifetime = true,         
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.FromSeconds(30)
    };
});
builder.Services.AddAuthorization();
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

    if (context.Database.HasPendingModelChanges())
    {
        throw new InvalidOperationException("Há alterações de modelo aguardando revisão. Revise a refatoração de Address antes de gerar e aplicar a migration.");
    }
    await context.Database.MigrateAsync();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseHttpsRedirection(); 
app.UseAuthentication(); 
app.UseAuthorization();  
app.MapControllers();
app.Run();
