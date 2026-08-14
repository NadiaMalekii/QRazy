namespace QRCodeAPI.Models;

using System.ComponentModel.DataAnnotations;

public class GenerateQRRequest
{
    [Required(ErrorMessage = "Name is required")]
    public string Name { get; set; }

    public string? Data { get; set; }

    [Range(1, 1000)]
    public int Size { get; set; } = 300;
}

public class ReadQRRequest
{
    [Required(ErrorMessage = "Image data is required")]
    public string ImageData { get; set; } 
}

public class QRCodeResponse
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Data { get; set; }
    public string ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public Dictionary<string, string> Links { get; set; }
}

public class QRCodeReadResponse
{
    public string Text { get; set; }
    public string Format { get; set; }
    public DateTime DecodedAt { get; set; }
    public Dictionary<string, string> Metadata { get; set; }
    public List<string> Errors { get; set; }
}

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public T Data { get; set; }
    public List<string> Errors { get; set; }
    public DateTime Timestamp { get; set; }
}
