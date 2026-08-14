using QRCodeAPI.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.WriteIndented = true;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "QR Code API",
        Version = "v1",
        Description = "RESTful API for generating and scanning QR codes"
    });
});

builder.Services.AddScoped<IQRCodeService, QRCodeService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp",
        builder =>
        {
            builder.WithOrigins("http://localhost:3000", "http://localhost:3001")
                   .AllowAnyHeader()
                   .AllowAnyMethod()
                   .AllowCredentials();
        });
});

builder.Services.AddHealthChecks();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "QR Code API v1");
    });
}

app.UseHttpsRedirection();
app.UseCors("ReactApp");
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();