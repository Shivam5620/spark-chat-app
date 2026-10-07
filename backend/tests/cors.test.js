import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { corsOptions, originAllowed, cookieOptions } from "../config/env.js";
test("REST and Socket.IO accept configured origins with credentials; reject others", async () => {
  const app = express();
  app.use(cors(corsOptions));
  app.get("/api/check", (req, res) => res.json({ ok: true }));
  app.use((err, req, res, next) =>
    res.status(err.status).json({ error: err.message }),
  );
  const server = createServer(app);
  const io = new Server(server, {
    cors: corsOptions,
    allowRequest: (req, cb) => cb(null, originAllowed(req.headers.origin)),
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const origin of [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ]) {
      for (const path of [
        "/api/check",
        "/socket.io/?EIO=4&transport=polling",
      ]) {
        const res = await fetch(url + path, { headers: { Origin: origin } });
        assert.equal(res.status, 200);
        assert.equal(res.headers.get("access-control-allow-origin"), origin);
        assert.equal(
          res.headers.get("access-control-allow-credentials"),
          "true",
        );
      }
      const preflight = await fetch(url + "/api/check", {
        method: "OPTIONS",
        headers: {
          Origin: origin,
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "content-type",
        },
      });
      assert.equal(preflight.status, 204);
    }
    const bad = await fetch(url + "/api/check", {
      headers: { Origin: "https://untrusted.example" },
    });
    assert.equal(bad.status, 403);
    assert.equal(bad.headers.get("access-control-allow-origin"), null);
    const badSocket = await fetch(url + "/socket.io/?EIO=4&transport=polling", {
      headers: { Origin: "https://untrusted.example" },
    });
    assert.notEqual(badSocket.status, 200);
    assert.equal(cookieOptions().secure, false);
    assert.equal(cookieOptions().httpOnly, true);
  } finally {
    await new Promise((resolve) => io.close(resolve));
  }
});
