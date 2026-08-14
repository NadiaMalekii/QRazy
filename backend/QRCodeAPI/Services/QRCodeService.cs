using QRCoder;
using System.Drawing;
using ZXing;
using ZXing.Windows.Compatibility;

namespace QRCodeAPI.Services;

public class QRCodeService : IQRCodeService
{
    public byte[] GenerateQRCode(string name, string data, int size = 300)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(data, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new QRCode(qrCodeData);

        using var bitmap = qrCode.GetGraphic(size / 10);
        using var stream = new MemoryStream();
        bitmap.Save(stream, System.Drawing.Imaging.ImageFormat.Png);
        return stream.ToArray();
    }

    public string DecodeQRCode(byte[] imageBytes)
    {
        try
        {
            using var stream = new MemoryStream(imageBytes);
            using var bitmap = new Bitmap(stream);

            var reader = new BarcodeReader<Bitmap>(bitmap => new BitmapLuminanceSource(bitmap));
            var result = reader.Decode(bitmap);

            return result?.Text ?? "No QR code found";
        }
        catch (Exception ex)
        {
            return $"Error decoding: {ex.Message}";
        }
    }
}
