FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["Projetos - 4.csproj", "./"]
RUN dotnet restore "Projetos - 4.csproj"
COPY . .
RUN dotnet publish "Projetos - 4.csproj" -c Release -o /out --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
USER root
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /out .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "Projetos - 4.dll"]
