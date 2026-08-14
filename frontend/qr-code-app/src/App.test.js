import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders the QRazy workspace', async () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /make every scan simple/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /create/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /scan/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /generate code/i })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText(/api connected/i)).toBeInTheDocument());
});
