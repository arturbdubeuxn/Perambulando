
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Projetos___4._2___Application.Interfaces;
using Projetos___4._2___Application.Services;
using Projetos___4._3___Domain.Interfaces.Service;
using Projetos___4._3___Domain.Service;
using Microsoft.EntityFrameworkCore;
using Projetos___4._3___Domain.Model;
using Projetos___4._4___Data.Context;

// 2. Inicialização: prepara configurações, serviços, logging e servidor web.
// Carrega appsettings.json, configurações do ambiente e argumentos de execução.
var builder = WebApplication.CreateBuilder(args);

// 3. Configuração local: carrega a chave JWT apenas no ambiente Development.
if (builder.Environment.IsDevelopment())
{
    // O arquivo pode estar ausente; alterações nele exigem reiniciar a aplicação.
    builder.Configuration.AddJsonFile("appsettings.json", optional: true, reloadOnChange: false);
    builder.Configuration.AddEnvironmentVariables();
    builder.Configuration.AddCommandLine(args);
}


// 4. Controllers: registra os serviços necessários aos endpoints da API.
builder.Services.AddControllers();

// 5. Banco de dados: registra o Context com o provedor PostgreSQL (Npgsql).
// A conexão vem da configuração ConnectionStrings:DefaultConnection.
builder.Services.AddDbContext<Context>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
// 6. Identity: gerencia usuários, roles, senhas e persistência pelo Context.
builder.Services
    .AddIdentity<User, IdentityRole>()
    .AddEntityFrameworkStores<Context>()
    // Provedores para confirmação de e-mail, recuperação de senha etc.; não emitem o JWT do login.
    .AddDefaultTokenProviders();

// Exige e-mails únicos nas operações realizadas pelo UserManager.
builder.Services.Configure<IdentityOptions>(options =>
{
    options.User.RequireUniqueEmail = true;
    // Usa os mesmos nomes de claims do JWT, inclusive em UserManager.GetUserId(User).
    options.ClaimsIdentity.UserIdClaimType = "sub";
    options.ClaimsIdentity.UserNameClaimType = "name";
    options.ClaimsIdentity.RoleClaimType = "role";
});

// INJEÇÃO DE DEPENDências
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IUserAppService, UserAppService>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<Projetos___4.Application.Interfaces.IHostAppService, Projetos___4.Application.AppServices.HostAppService>();
builder.Services.AddScoped<Projetos___4.Domain.Interfaces.Service.IHostService, Projetos___4.Domain.Service.HostService>();
builder.Services.AddScoped<Projetos___4.Domain.Interfaces.Repository.IHostRepository, Projetos___4.Data.Repository.HostRepository>();
builder.Services.AddScoped<Projetos___4._3___Domain.Interfaces.IUserRepository, Projetos___4._4___Data.Repository.UserRepository>();

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
    // Preserva as claims curtas, sem convertê-las em nomes de schemas.
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        NameClaimType = "name",
        RoleClaimType = "role",
        ValidateIssuer = true,           // Confere quem emitiu o token.
        ValidateAudience = true,         // Confere a aplicação destinatária.
        ValidateLifetime = true,         // Confere início da validade e expiração.
        ValidateIssuerSigningKey = true, // Valida a chave usada na assinatura; a assinatura também é verificada.
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.FromSeconds(30) // Tolerância de 30 segundos nas verificações de tempo.
    };
});
// 10. Autorização
builder.Services.AddAuthorization();

// 11. OpenAPI: registra a geração do documento que descreve os endpoints.
builder.Services.AddOpenApi();

// 12. Construção
var app = builder.Build();

// 13. Migrações: em Development, aplica migrações pendentes antes de aceitar requisições.
if (app.Environment.IsDevelopment())
{
    // Cria um escopo para obter e descartar corretamente o Context durante a inicialização.
    await using var scope = app.Services.CreateAsyncScope();
    var context = scope.ServiceProvider.GetRequiredService<Context>();

    // Verifica se existem migrações no projeto; não verifica se o banco já está atualizado.
    if (!context.Database.GetMigrations().Any())
    {
        throw new InvalidOperationException(
            "No EF Core migrations were found. Create the initial migration with " +
            "`dotnet ef migrations add InitialCreate --output-dir \"4 - Data/Migrations\"`.");
    }

    // Aplica as migrações existentes. Não gera migrações para alterações novas nas entidades.
    await context.Database.MigrateAsync();
}

// 14. Documento da API: publica o endpoint OpenAPI apenas em Development.
// MapOpenApi expõe o JSON da documentação; uma interface Swagger não é configurada aqui.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseHttpsRedirection(); 
app.UseAuthentication(); 
app.UseAuthorization();  
app.MapControllers();
app.Run();
