import { Hono } from "https://deno.land/x/hono/mod.ts";
import { serveStatic } from "https://deno.land/x/hono/middleware.ts";

const app = new Hono();
// server/main.ts
app.post("/api/auth/callback", async (c) => {
  try {
    const { code } = await c.req.json();
    const clientId = Deno.env.get("TRAQ_CLIENT_ID"); //

    if (!clientId) {
      console.error("Error: TRAQ_CLIENT_ID is not set in environment variables.");
      return c.json({ error: "Server environment configuration error" }, 500);
    }

    // traQ トークンエンドポイントへリクエスト
    const response = await fetch("https://q.trap.jp/api/v3/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code", //
        client_id: clientId,               //
        code: code,                        //
      }),
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      console.error("traQ API Error:", errorDetail);
      return c.json({ error: "traQ authentication failed", details: errorDetail }, response.status as any);
    }

    const tokenData = await response.json(); //
    return c.json(tokenData);

  } catch (err) {
    console.error("Unhandled Server Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: "Internal Server Error", message }, 500);
  }
});

// 画像プロキシエンドポイント
app.get("/api/stamps/:stampId/image", async (c) => {
  try {
    const stampId = c.req.param("stampId");
    const accessToken = c.req.header("Authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // traQ の画像エンドポイントに アクセストークンを付けてリクエスト
    const response = await fetch(`https://q.trap.jp/api/v3/stamps/${stampId}/image`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      return c.json({ error: "Failed to fetch image" }, response.status as any);
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("Content-Type") || "image/png";

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (err) {
    console.error("Image proxy error:", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.use("/*", serveStatic({ root: "./dist" }));

app.get("*", serveStatic({ path: "./dist/index.html" }));

Deno.serve(app.fetch);