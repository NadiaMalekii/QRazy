import React, { useRef, useState } from 'react';
import { scanQRCode } from '../api/qrCodeApi';

const QRScanner = () => {
  const fileInputRef = useRef(null);
  const [decodedCode, setDecodedCode] = useState(null);
  const [selectedFile, setSelectedFile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const readFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('The selected image could not be read.'));
    reader.readAsDataURL(file);
  });

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('That image is larger than 10 MB. Choose a smaller file and try again.');
      event.target.value = '';
      return;
    }

    setSelectedFile(file.name);
    setDecodedCode(null);
    setError('');
    setCopied(false);
    setLoading(true);

    try {
      const imageData = await readFile(file);
      const result = await scanQRCode(imageData);
      setDecodedCode(result);
    } catch (requestError) {
      setError(requestError.message || 'No QR code was found in this image.');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleCopy = async () => {
    if (!decodedCode?.text) return;

    try {
      await navigator.clipboard.writeText(decodedCode.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch (copyError) {
      setError('Copy is not available in this browser. Select the result manually instead.');
    }
  };

  const clearResult = () => {
    setDecodedCode(null);
    setSelectedFile('');
    setError('');
    setCopied(false);
  };

  return (
    <div className="qr-tool">
      <div className="tool-heading">
        <div>
          <p className="eyebrow">Decode</p>
          <h2>Read a QR code</h2>
        </div>
        <span className="tool-hint">API powered</span>
      </div>
      <p className="tool-description">Choose a QR image from your device. On mobile, the same button can open your camera.</p>

      <button
        type="button"
        className="upload-zone"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
      >
        <span className="upload-icon" aria-hidden="true">+</span>
        <span className="upload-copy">
          <strong>{loading ? 'Reading your image...' : 'Choose an image to scan'}</strong>
          <small>PNG, JPG, or WEBP up to 10 MB</small>
        </span>
        <span className="upload-arrow" aria-hidden="true">-&gt;</span>
      </button>
      <input
        ref={fileInputRef}
        className="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/*"
        capture="environment"
        onChange={handleFileUpload}
        aria-label="Choose QR code image"
      />

      {selectedFile && !decodedCode && !error && (
        <p className="file-status"><span className="status-dot online" />{selectedFile}</p>
      )}
      {loading && <div className="scan-progress" aria-label="Scanning"><span /></div>}
      {error && <div className="message error-message" role="alert">{error}</div>}

      {decodedCode && (
        <section className="scan-result" aria-live="polite">
          <div className="result-header">
            <div>
              <p className="eyebrow">Scan complete</p>
              <h3>QR code decoded</h3>
            </div>
            <span className="success-badge"><span />Success</span>
          </div>
          <div className="decoded-content">
            <p className="detail-label">Decoded content</p>
            <div className="result-text">{decodedCode.text}</div>
            <div className="scan-meta">
              <span>Format <strong>{decodedCode.format}</strong></span>
              <span>Characters <strong>{decodedCode.text.length}</strong></span>
            </div>
            <div className="result-actions">
              <button type="button" className="secondary-action" onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy result'}
              </button>
              <button type="button" className="text-action" onClick={clearResult}>Scan another image</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default QRScanner;
