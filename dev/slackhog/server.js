const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "9002", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // Initialize WebSocket server after Next.js is ready
  // We need to import this dynamically after the app is built
  if (!dev) {
    // In production, the build output will be in .next/standalone
    try {
      const {
        initWebSocketServer,
      } = require("./.next/server/src/lib/websocket.js");
      initWebSocketServer(server);
    } catch (error) {
      console.error("Failed to initialize WebSocket server:", error);
    }
  } else {
    // In development, use the TypeScript source
    const register = require("./node_modules/tsx/dist/register.cjs");
    register.register();
    const { initWebSocketServer } = require("./src/lib/websocket.ts");
    initWebSocketServer(server);
  }

  server.listen(port, () => {
    console.log(`> Slackhog ready on http://${hostname}:${port}`);
  });
});
