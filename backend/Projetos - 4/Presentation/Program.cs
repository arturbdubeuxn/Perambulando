using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Projetos___4.Application.AppServices;
using Projetos___4.Application.Mapping;
using Projetos___4.Application.Mapping.Interfaces;
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
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("ProgrammingInteractions", context =>
        System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});
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
    options.Lockout.AllowedForNewUsers = true;
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
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
builder.Services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<ISubscriptionMapping, SubscriptionMapping>();
builder.Services.AddScoped<ISubscriptionAppService, SubscriptionAppService>();
builder.Services.AddHttpClient<IPostalCodeService, ViaCepService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(8);
}).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler { AllowAutoRedirect = false });
builder.Services.AddScoped<IFavoriteRepository, FavoriteRepository>();
builder.Services.AddScoped<IFavoriteService, FavoriteService>();
builder.Services.AddScoped<IFavoriteAppService, FavoriteAppService>();
builder.Services.AddScoped<IAddressRepository, AddressRepository>();
builder.Services.AddScoped<IAddressService, AddressService>();
builder.Services.AddScoped<IAddressAppService, AddressAppService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IUserAppService, UserAppService>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<IHostAppService,HostAppService>();
builder.Services.AddScoped<IHostService,HostService>();
builder.Services.AddScoped<ICnpjValidations, CnpjValidations>();
builder.Services.AddHttpClient<ICompanyRegistrationService, MinhaReceitaService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
}).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler { AllowAutoRedirect = false });
builder.Services.AddScoped<IHostRepository,HostRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProgrammingRepository,ProgrammingRepository>();
builder.Services.AddScoped<IProgrammingService, ProgrammingService>();
builder.Services.AddScoped<IProgrammingXCategoryRepository, ProgrammingXCategoryRepository>();
builder.Services.AddScoped<IProgrammingXCategoryService, ProgrammingXCategoryService>();
builder.Services.AddScoped<IProgrammingXCategoryAppService, ProgrammingXCategoryAppService>();
builder.Services.AddScoped<IProgrammingAppService, ProgrammingAppService>();
builder.Services.AddScoped<IProgrammingMapping, ProgrammingMapping>();
builder.Services.AddScoped<IProgrammingFilterMapping, ProgrammingFilterMapping>();
builder.Services.AddScoped<IAddressMapping, AddressMapping>();
builder.Services.AddScoped<ICategoryMapping, CategoryMapping>();
builder.Services.AddScoped<IUserMapping, UserMapping>();
builder.Services.AddScoped<IHostMapping, HostMapping>();
builder.Services.AddScoped<IHostFilterMapping, HostFilterMapping>();
builder.Services.AddScoped<IFavoriteMapping, FavoriteMapping>();
builder.Services.AddScoped<IUserXCategoryMapping, UserXCategoryMapping>();
builder.Services.AddScoped<IProgrammingXCategoryMapping, ProgrammingXCategoryMapping>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ICategoryAppService, CategoryAppService>();
builder.Services.AddScoped<IUserXCategoryRepository, UserXCategoryRepository>();
builder.Services.AddScoped<IUserXCategoryService, UserXCategoryService>();
builder.Services.AddScoped<IUserXCategoryValidations, UserXCategoryValidations>();
builder.Services.AddScoped<IUserXCategoryAppService, UserXCategoryAppService>();
builder.Services.AddScoped<IValidation<ProgrammingDTO>, ProgrammingValidation>();
builder.Services.AddScoped<IValidation<HostDTO>, HostValidation>();
builder.Services.AddScoped<IValidation<UserDTO>, UserValidation>();
builder.Services.AddScoped<IValidation<UserXCategoryDTO>, UserXCategoryValidation>();
builder.Services.AddScoped<IProgrammingInteractionRepository, ProgrammingInteractionRepository>();
builder.Services.AddScoped<IProgrammingInteractionService, ProgrammingInteractionService>();
builder.Services.AddScoped<IProgrammingInteractionMapping, ProgrammingInteractionMapping>();
builder.Services.AddScoped<IProgrammingInteractionAppService, ProgrammingInteractionAppService>();
builder.Services.AddScoped<IProgrammingInteractionValidation, ProgrammingInteractionValidation>();
builder.Services.AddScoped<IHostStatisticsRepository, HostStatisticsRepository>();
builder.Services.AddScoped<IHostStatisticsService, HostStatisticsService>();
builder.Services.AddScoped<ISumarryStatitcsValidations, SumarryStatitcsValidations>();
//builder.Services.AddScoped<IHostStatisticsAccessService, HostStatisticsAccessService>();
builder.Services.AddScoped<IHostStatisticsFilterMapping, HostStatisticsFilterMapping>();
builder.Services.AddScoped<IHostStatisticsSummaryMapping, HostStatisticsSummaryMapping>();
builder.Services.AddScoped<IHostStatisticsDailyMapping, HostStatisticsDailyMapping>();
builder.Services.AddScoped<IHostStatisticsRankingMapping, HostStatisticsRankingMapping>();
builder.Services.AddScoped<IHostStatisticsRankingFilterMapping, HostStatisticsRankingFilterMapping>();
builder.Services.AddScoped<IRankingStatisticsValidations, RankingStatisticsValidations>();
builder.Services.AddScoped<IHostStatisticsAppService, HostStatisticsAppService>();



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
        throw new InvalidOperationException("Há alterações de modelo aguardando revisão. Revise as alterações antes de gerar e aplicar a migration.");
    }
    await context.Database.MigrateAsync();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseHttpsRedirection(); 
app.UseRouting();
app.UseAuthentication(); 
app.UseAuthorization();  
app.UseRateLimiter();
app.MapControllers();
app.Run();
