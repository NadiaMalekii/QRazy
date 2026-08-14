namespace QRCodeAPI.Services;

public interface IQRCodeService
{
    byte[] GenerateQRCode(string name, string data, int size = 300);
    string DecodeQRCode(byte[] imageBytes);
}
