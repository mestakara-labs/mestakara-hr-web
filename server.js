const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

// cPanel akan mengatur environment ke 'production' secara otomatis,
// namun kita pastikan fallback-nya aman
const dev = process.env.NODE_ENV !== "production";

// Phusion Passenger di cPanel akan menyediakan process.env.PORT secara dinamis
const port = process.env.PORT || 3000;
const hostname = "localhost";

// Inisialisasi aplikasi Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      // Biarkan Next.js menangani semua request routing
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Server ready on http://${hostname}:${port}`);
    });
});
