import React, { useState } from 'react';
import { downloadQRCode, generateQRCode } from '../api/qrCodeApi';

const QRGenerator = () => {
  const [name, setName] = useState('');
  const [data, setData] = useState('');
  const [size, setSize] = useState(300);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedData = data.trim();

    if (!trimmedName) {
      setError('Add a name so you can identify this QR code later.');
      return;
    }

    setLoading(true);
    setError('');
    setCopied(false);

    try {
      const result = await generateQRCode({
        name: trimmedName,
        data: trimmedData || trimmedName,
        size,
      });
      setGeneratedCode(result);
    } catch (requestError) {
      setGeneratedCode(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedCode) return;

    setDownloading(true);
    setError('');

    try {
      const blob = await downloadQRCode(generatedCode.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${generatedCode.name || 'qrcode'}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedCode?.data) return;

    try {
      await navigator.clipboard.writeText(generatedCode.data);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch (copyError) {
      setError('Copy is not available in this browser. Select the data manually instead.');
    }
  };

  const clearForm = () => {
    setName('');
    setData('');
    setSize(300);
    setGeneratedCode(null);
    setError('');
    setCopied(false);
  };

  return (
    <div className="qr-tool">
      <div className="tool-heading">
        <div>
          <p className="eyebrow">Create</p>
          <h2>Generate a QR code</h2>
        </div>
        <span className="tool-hint">PNG output</span>
      </div>
      <p className="tool-description">Turn a link, note, or contact detail into a code that is ready to share.</p>

      <form onSubmit={handleGenerate} className="qr-form">
        <div className="field-row">
          <div className="form-field">
            <label htmlFor="qr-name">Name</label>
            <input
              id="qr-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Event registration"
              maxLength={120}
              autoComplete="off"
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="qr-data">Content</label>
            <input
              id="qr-data"
              type="text"
              value={data}
              onChange={(event) => setData(event.target.value)}
              placeholder="https://example.com"
              maxLength={2000}
              autoComplete="off"
            />
            <span className="field-note">Uses the name when left empty</span>
          </div>
        </div>

        <div className="size-field">
          <div className="size-label">
            <label htmlFor="qr-size">Image size</label>
            <output htmlFor="qr-size">{size} px</output>
          </div>
          <input
            id="qr-size"
            type="range"
            min="200"
            max="600"
            step="50"
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
          />
          <div className="range-labels"><span>Compact</span><span>High resolution</span></div>
        </div>

        {error && <div className="message error-message" role="alert">{error}</div>}

        <button type="submit" className="primary-action" disabled={loading}>
          {loading ? <><span className="spinner" />Generating code</> : <>Generate code <span aria-hidden="true">-&gt;</span></>}
        </button>
      </form>

      {generatedCode && (
        <section className="generated-result" aria-live="polite">
          <div className="result-header">
            <div>
              <p className="eyebrow">Your code is ready</p>
              <h3>{generatedCode.name}</h3>
            </div>
            <span className="success-badge"><span />Saved by API</span>
          </div>
          <div className="result-body">
            <div className="qr-image-container">
              <img src={generatedCode.imageUrl} alt={`QR code for ${generatedCode.name}`} />
            </div>
            <div className="result-details">
              <p className="detail-label">Encoded content</p>
              <p className="encoded-value">{generatedCode.data}</p>
              <div className="result-actions">
                <button type="button" className="secondary-action" onClick={handleCopy}>
                  {copied ? 'Copied' : 'Copy content'}
                </button>
                <button type="button" className="primary-action compact" onClick={handleDownload} disabled={downloading}>
                  {downloading ? 'Preparing...' : 'Download PNG'}
                </button>
              </div>
              <button type="button" className="text-action" onClick={clearForm}>Create another code</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default QRGenerator;
