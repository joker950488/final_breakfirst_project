# 早餐店訂餐系統

這是一個使用 Next.js 開發的早餐店訂餐系統，提供顧客線上點餐、廚房訂單管理、外送員配送等功能。

## 功能特點

- 顧客功能

  - 線上瀏覽菜單
  - 購物車管理
  - 訂單追蹤
  - 歷史訂單查詢

- 廚房功能

  - 即時訂單通知
  - 訂單狀態管理
  - 訂單完成確認

- 外送功能

  - 即時訂單指派
  - 配送狀態追蹤
  - 訂單完成確認

- 管理功能
  - 菜單管理
  - 員工管理
  - 訂單管理
  - 報表統計

## 技術棧

- 前端：Next.js 14、React、Tailwind CSS
- 後端：Next.js API Routes
- 資料庫：PostgreSQL (Prisma ORM)
- 即時通訊：MQTT
- 認證：NextAuth.js

## 開始使用

1. 克隆專案

```bash
git clone [您的專案網址]
cd [專案資料夾]
```

2. 安裝依賴

```bash
npm install
# 或
yarn install
```

3. 設置環境變數
   複製 `.env.example` 到 `.env.local` 並填入必要的環境變數：

```bash
cp .env.example .env.local
```

4. 初始化資料庫

```bash
npx prisma db push
npx prisma db seed
```

5. 啟動開發伺服器

```bash
npm run dev
# 或
yarn dev
```

開啟 [http://localhost:3000](http://localhost:3000) 即可看到結果。

## 環境變數

在 `.env.local` 中設置以下環境變數：

```env
# 資料庫
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# MQTT
NEXT_PUBLIC_MQTT_BROKER_URL="wss://broker.emqx.io:8084/mqtt"
NEXT_PUBLIC_MQTT_TOPIC="your-topic"

# 其他設定
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

## 部署

本專案可以部署到 Vercel 平台：

1. 在 Vercel 上創建新專案
2. 連接您的 GitHub 倉庫
3. 設置必要的環境變數
4. 部署！

## 貢獻

歡迎提交 Pull Request 或開 Issue 來改進這個專案。

## 授權

MIT License
