using Microsoft.AspNetCore.Mvc;
using QRCodeAPI.Models;
using QRCodeAPI.Services;
using System.Text.Json;
using QRCodeAPI.Models;

namespace QRCodeAPI.Controllers;

[ApiController]
[Route("api/v1/qrcodes")] 
[Produces("application/json")]
public class QRCodeController : ControllerBase
{
    private readonly IQRCodeService _qrService;
    private readonly ILogger<QRCodeController> _logger;

    public QRCodeController(IQRCodeService qrService, ILogger<QRCodeController> logger)
    {
        _qrService = qrService;
        _logger = logger;
    }

    /// <summary>
    /// POST /api/v1/qrcodes - Generate a new QR code
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<QRCodeResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GenerateQRCode([FromBody] GenerateQRRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Validation failed",
                    Errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList(),
                    Timestamp = DateTime.UtcNow
                });
            }

            var data = string.IsNullOrEmpty(request.Data) ? request.Name : request.Data;
            var qrBytes = _qrService.GenerateQRCode(request.Name, data, request.Size);
            var base64Image = Convert.ToBase64String(qrBytes);

            var qrId = Guid.NewGuid().ToString();
            var response = new QRCodeResponse
            {
                Id = qrId,
                Name = request.Name,
                Data = data,
                ImageUrl = $"data:image/png;base64,{base64Image}",
                CreatedAt = DateTime.UtcNow,
                Links = new Dictionary<string, string>
                {
                    ["self"] = $"/api/v1/qrcodes/{qrId}",
                    ["download"] = $"/api/v1/qrcodes/{qrId}/download"
                }
            };

            QRCodeStore.Add(qrId, qrBytes);

            return CreatedAtAction(
                nameof(GetQRCode),
                new { id = qrId },
                new ApiResponse<QRCodeResponse>
                {
                    Success = true,
                    Message = "QR Code generated successfully",
                    Data = response,
                    Timestamp = DateTime.UtcNow
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating QR code for name: {Name}", request.Name);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while generating QR code",
                Errors = new List<string> { ex.Message },
                Timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// GET /api/v1/qrcodes/{id} - Get QR code details
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<QRCodeResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetQRCode(string id)
    {
        if (!QRCodeStore.Exists(id))
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = $"QR Code with ID '{id}' not found",
                Timestamp = DateTime.UtcNow
            });
        }

        var qrBytes = QRCodeStore.Get(id);
        var base64Image = Convert.ToBase64String(qrBytes);

        var response = new QRCodeResponse
        {
            Id = id,
            Name = "QR Code",
            Data = "QR Code Data",
            ImageUrl = $"data:image/png;base64,{base64Image}",
            CreatedAt = DateTime.UtcNow,
            Links = new Dictionary<string, string>
            {
                ["self"] = $"/api/v1/qrcodes/{id}",
                ["download"] = $"/api/v1/qrcodes/{id}/download"
            }
        };

        return Ok(new ApiResponse<QRCodeResponse>
        {
            Success = true,
            Message = "QR Code retrieved successfully",
            Data = response,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// GET /api/v1/qrcodes/{id}/download - Download QR code image
    /// </summary>
    [HttpGet("{id}/download")]
    [Produces("image/png")]
    public IActionResult DownloadQRCode(string id)
    {
        if (!QRCodeStore.Exists(id))
        {
            return NotFound();
        }

        var qrBytes = QRCodeStore.Get(id);
        return File(qrBytes, "image/png", $"qrcode-{id}.png");
    }

    /// <summary>
    /// POST /api/v1/qrcodes/scan - Scan/Read QR code from image
    /// </summary>
    [HttpPost("scan")]
    [ProducesResponseType(typeof(ApiResponse<QRCodeReadResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public IActionResult ScanQRCode([FromBody] ReadQRRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.ImageData))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Image data is required",
                    Errors = new List<string> { "ImageData cannot be empty" },
                    Timestamp = DateTime.UtcNow
                });
            }

            // Handle data URL
            var base64Data = request.ImageData;
            if (base64Data.Contains(","))
            {
                var parts = base64Data.Split(',');
                if (parts.Length == 2)
                {
                    base64Data = parts[1];
                }
            }

            var imageBytes = Convert.FromBase64String(base64Data);
            var decodedText = _qrService.DecodeQRCode(imageBytes);

            if (decodedText.StartsWith("Error"))
            {
                return Ok(new ApiResponse<QRCodeReadResponse>
                {
                    Success = false,
                    Message = "Failed to decode QR code",
                    Data = new QRCodeReadResponse
                    {
                        Text = string.Empty,
                        Format = "Unknown",
                        DecodedAt = DateTime.UtcNow,
                        Errors = new List<string> { decodedText }
                    },
                    Timestamp = DateTime.UtcNow
                });
            }

            var metadata = new Dictionary<string, string>();
            try
            {
                var jsonDoc = JsonDocument.Parse(decodedText);
                foreach (var property in jsonDoc.RootElement.EnumerateObject())
                {
                    metadata[property.Name] = property.Value.ToString();
                }
            }
            catch
            {
                
            }

            var response = new QRCodeReadResponse
            {
                Text = decodedText,
                Format = "QR Code",
                DecodedAt = DateTime.UtcNow,
                Metadata = metadata.Count > 0 ? metadata : null,
                Errors = new List<string>()
            };

            return Ok(new ApiResponse<QRCodeReadResponse>
            {
                Success = true,
                Message = "QR Code scanned successfully",
                Data = response,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (FormatException ex)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "Invalid image format",
                Errors = new List<string> { "The provided image data is not valid base64" },
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scanning QR code");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while scanning QR code",
                Errors = new List<string> { ex.Message },
                Timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// DELETE /api/v1/qrcodes/{id} - Delete QR code
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult DeleteQRCode(string id)
    {
        if (!QRCodeStore.Exists(id))
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = $"QR Code with ID '{id}' not found",
                Timestamp = DateTime.UtcNow
            });
        }

        QRCodeStore.Remove(id);
        return NoContent();
    }

    /// <summary>
    /// GET /api/v1/qrcodes - List all QR codes (optional query params)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<QRCodeResponse>>), StatusCodes.Status200OK)]
    public IActionResult GetQRCodeList([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var qrCodes = QRCodeStore.GetAll()
            .Select((bytes, index) => new QRCodeResponse
            {
                Id = $"qr-{index}",
                Name = $"QR Code {index}",
                Data = "Encoded Data",
                ImageUrl = $"data:image/png;base64,{Convert.ToBase64String(bytes)}",
                CreatedAt = DateTime.UtcNow.AddMinutes(-index),
                Links = new Dictionary<string, string>
                {
                    ["self"] = $"/api/v1/qrcodes/qr-{index}",
                    ["download"] = $"/api/v1/qrcodes/qr-{index}/download"
                }
            })
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Ok(new ApiResponse<List<QRCodeResponse>>
        {
            Success = true,
            Message = "QR Codes retrieved successfully",
            Data = qrCodes,
            Timestamp = DateTime.UtcNow
        });
    }
}

public static class QRCodeStore
{
    private static readonly Dictionary<string, byte[]> _store = new();
    private static readonly object _lock = new();

    public static void Add(string id, byte[] data)
    {
        lock (_lock)
        {
            _store[id] = data;
        }
    }

    public static byte[] Get(string id)
    {
        lock (_lock)
        {
            return _store.TryGetValue(id, out var data) ? data : null;
        }
    }

    public static bool Exists(string id)
    {
        lock (_lock)
        {
            return _store.ContainsKey(id);
        }
    }

    public static void Remove(string id)
    {
        lock (_lock)
        {
            _store.Remove(id);
        }
    }

    public static List<byte[]> GetAll()
    {
        lock (_lock)
        {
            return _store.Values.ToList();
        }
    }
}