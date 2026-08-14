const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1/qrcodes').replace(/\/$/, '');

const getApiUrl = (path) => `${API_BASE_URL}${path}`;

const getValue = (value, key) => value?.[key] ?? value?.[key[0].toUpperCase() + key.slice(1)];

const getErrorMessage = (payload, fallback) => {
  const message = getValue(payload, 'message');
  const errors = getValue(payload, 'errors');

  if (message) {
    return errors?.length ? `${message}: ${errors.join(', ')}` : message;
  }

  return fallback;
};

const request = async (path, options = {}) => {
  let response;

  try {
    response = await fetch(getApiUrl(path), {
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      ...options,
    });
  } catch (error) {
    throw new Error('The API is unreachable. Start the QRazy backend and try again.');
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok || getValue(payload, 'success') === false) {
    throw new Error(getErrorMessage(payload, `Request failed with status ${response.status}.`));
  }

  return payload;
};

const unwrap = (payload) => getValue(payload, 'data') ?? payload;

export const normalizeQRCode = (value) => ({
  id: getValue(value, 'id'),
  name: getValue(value, 'name'),
  data: getValue(value, 'data'),
  imageUrl: getValue(value, 'imageUrl'),
  createdAt: getValue(value, 'createdAt'),
  links: getValue(value, 'links') || {},
});

export const generateQRCode = async ({ name, data, size }) => {
  const payload = await request('', {
    method: 'POST',
    body: JSON.stringify({ name, data, size }),
  });

  return normalizeQRCode(unwrap(payload));
};

export const scanQRCode = async (imageData) => {
  const payload = await request('/scan', {
    method: 'POST',
    body: JSON.stringify({ imageData }),
  });
  const result = unwrap(payload);

  if (getValue(payload, 'success') === false || getValue(result, 'errors')?.length) {
    throw new Error(getErrorMessage(payload, 'No QR code was found in this image.'));
  }

  return {
    text: getValue(result, 'text') || '',
    format: getValue(result, 'format') || 'QR Code',
    decodedAt: getValue(result, 'decodedAt'),
    metadata: getValue(result, 'metadata') || {},
  };
};

export const downloadQRCode = async (id) => {
  let response;

  try {
    response = await fetch(getApiUrl(`/${encodeURIComponent(id)}/download`));
  } catch (error) {
    throw new Error('The API is unreachable. Start the QRazy backend and try again.');
  }

  if (!response.ok) {
    throw new Error('The QR code download is no longer available.');
  }

  return response.blob();
};

export const checkApiHealth = async () => {
  const apiOrigin = API_BASE_URL.startsWith('/')
    ? window.location.origin
    : new URL(API_BASE_URL).origin;
  const response = await fetch(`${apiOrigin}/health`);
  return response.ok;
};
