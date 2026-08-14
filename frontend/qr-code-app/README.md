# QRazy frontend

React interface for the QRazy API. The app calls the backend at `http://localhost:5000` during local development.

## Run locally

1. Start the backend from `backend/QRCodeAPI` with `dotnet run --launch-profile http`.
2. In this directory, run `npm start`.
3. Open `http://localhost:3000`.

The API base defaults to `http://localhost:5000/api/v1/qrcodes`. For a separately hosted backend, set `REACT_APP_API_URL` to its `/api/v1/qrcodes` URL before building. See `.env.example`.

## Verify

- `npm test -- --watchAll=false --runInBand`
- `npm run build`
