# --- ステージ 1: Vue のビルド (Node.js) ---
FROM node:20-slim AS builder
WORKDIR /app
ARG VITE_TRAQ_CLIENT_ID
ENV VITE_TRAQ_CLIENT_ID=$VITE_TRAQ_CLIENT_ID
COPY package*.json ./
RUN npm install
RUN npm install vue-router@4
COPY . .
# ビルド実行 (dist フォルダが生成される)
RUN npm run build

# --- ステージ 2: 実行環境 (Deno) ---
FROM denoland/deno:alpine
WORKDIR /app

# ビルド済みのフロントエンドファイルをコピー
COPY --from=builder /app/dist ./dist
# サーバーのコード類をコピー
COPY . .

# ポート 8000 を開放
EXPOSE 8000

# サーバー起動 (deno.json の task を利用)
CMD ["task", "start"]