/// <reference lib="deno.window" />
import { Hono } from "hono";
import { cors } from "hono/middleware";
import { serveStatic } from "hono/middleware";

const app = new Hono();
app.use("/api/*", cors());

let cachedStamps: { n: string; i: string }[] = [];
let lastFetched = 0;
// --- API エンドポイント ---
// Showcase Hard 認証により、ここに来るリクエストには自動的に ID が付与されます
app.get("/api/me", (c) => {
  const userId = c.req.header("X-Forwarded-User") || "guest"; //
  return c.json({ userId });
});

app.get("/api/stamps", async (c) => {
  if (Date.now() - lastFetched > 3600000) {
    const res = await fetch("https://q.trap.jp/api/v3/stamps", {
      headers: { Authorization: `Bearer ${Deno.env.get("TRAQ_TOKEN")}` }
    });
    const data = await res.json();
    // Vue 側のメモリを節約するため、名前(n)とID(i)だけに絞る
    cachedStamps = data.map((s: any) => ({ n: s.name, i: s.id }));
    lastFetched = Date.now();
  }
  return c.json(cachedStamps);
});

// --- 静的ファイルの配信 ---
// ビルドされた Vue アプリ（./dist）を配信します
app.use("/*", serveStatic({ root: "./dist" }));
// どのパスにアクセスしても index.html を返す（SPA 対応）
app.get("*", serveStatic({ path: "./dist/index.html" }));

Deno.serve(app.fetch);