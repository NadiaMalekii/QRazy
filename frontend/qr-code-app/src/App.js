import React, { useEffect, useState } from 'react';
import './App.css';
import QRGenerator from './components/QRGenerator';
import QRScanner from './components/QRScanner';
import { checkApiHealth } from './api/qrCodeApi';

const tabs = [
  { id: 'generate', label: 'Create a QR code', shortLabel: 'Create' },
  { id: 'scan', label: 'Read a QR code', shortLabel: 'Scan' },
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('generate');
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    let mounted = true;

    checkApiHealth()
      .then((isHealthy) => {
        if (mounted) setApiStatus(isHealthy ? 'online' : 'offline');
      })
      .catch(() => {
        if (mounted) setApiStatus('offline');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const statusLabel = {
    checking: 'Checking API',
    online: 'API connected',
    offline: 'API offline',
  }[apiStatus];

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="QRazy home">
          <BrandMark />
          <span>QRazy</span>
        </a>
        <div className={`api-status ${apiStatus}`} role="status">
          <span className="status-dot" aria-hidden="true" />
          {statusLabel}
        </div>
      </header>

      <main className="page-content">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">QR workspace</p>
          <h1 id="page-title">Make every scan <em>simple.</em></h1>
          <p className="intro-copy">
            Create clean, downloadable QR codes or decode one from your camera and image library.
          </p>
        </section>

        <section className="workspace" aria-label="QR code workspace">
          <div className="tool-card">
            <nav className="tool-tabs" aria-label="QR code actions" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`tool-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`${tab.id}-panel`}
                >
                  <span>
                    <strong>{tab.shortLabel}</strong>
                    <small>{tab.label}</small>
                  </span>
                </button>
              ))}
            </nav>

            <div className="tool-panel" id={`${activeTab}-panel`} role="tabpanel">
              {activeTab === 'generate' ? <QRGenerator /> : <QRScanner />}
            </div>
          </div>

          <aside className="side-card">
            <div className="side-illustration" aria-hidden="true">
              <div className="illustration-frame">
                <span className="corner top-left" />
                <span className="corner top-right" />
                <span className="corner bottom-left" />
                <span className="corner bottom-right" />
                <span className="illustration-code">QR</span>
              </div>
            </div>
            <p className="eyebrow">Built for quick sharing</p>
            <h2>One place for your everyday codes.</h2>
            <ul className="benefit-list">
              <li><p>Generate crisp PNG codes in seconds.</p></li>
              <li><p>Decode images through the QRazy API.</p></li>
              <li><p>Keep your workflow focused and private.</p></li>
            </ul>
          </aside>
        </section>
      </main>

      <footer className="footer">
        <span>QRazy</span>
        <span>Fast, clear, ready to share.</span>
      </footer>
    </div>
  );
}

export default App;
