# Math Stars school distribution kit

This kit runs Math Stars on one school computer or small local server. Tablets and computers on the same Wi-Fi network can open it even when the internet connection is unavailable.

## Prepare once

1. Install Docker Desktop or Docker Engine on the host computer.
2. Copy `.env.example` to `.env` and replace both values.
3. From the repository root, run `docker compose --env-file school-kit/.env -f school-kit/docker-compose.yml up -d --build`.
4. Open `http://HOST-COMPUTER-IP:8080` from devices on the same Wi-Fi network.
5. Sign in with the private school access code and download the grade packs needed by the class.

The school kit explicitly permits its session cookie over local HTTP so it can work without a public domain or internet certificate. Run it only on a trusted, password-protected school or community network; use HTTPS if the server is reachable from the public internet.

The database is stored in the `math-stars-school-data` Docker volume. Back up that volume before replacing the host computer. The kit stores no precise location, advertising identifier, or open child profile.

For a no-internet installation, build and export the container image while connected, transfer it by USB, then import it on the school host with `docker load`.
