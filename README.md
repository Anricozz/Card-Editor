# Cardly — 卡面編輯器

一個基於 Vue 3 + Vite + Fabric.js 的卡片畫面編輯工具，支援卡面背景上傳與裁切、圖層管理、文字素材疊加，以及透過 ESRGAN 模型進行解析度放大後匯出。

## 技術棧

| 領域 | 技術 |
|------|------|
| 框架 | Vue 3 (Composition API, `<script setup>`) |
| 建構 | Vite |
| 樣式 | Tailwind CSS v4 |
| 畫布 | Fabric.js v6 |
| 圖示 | @iconify/vue + @iconify-json/mdi（本地註冊，不依賴 CDN） |
| 裁切 | Cropper.js |
| 放大 | Upscaler.js + @tensorflow/tfjs + ESRGAN-slim 模型 |
| 檔案下載 | file-saver |

## 功能概覽

- **卡面背景**：上傳圖片 → 裁切選取範圍 → 自動以 2 倍解析度存放以保留畫質
- **圖層系統**：匯入圖像素材、新增文字圖層；支援上移 / 下移 / 複製 / 刪除 / 重新命名 / 鎖定 / 顯示隱藏
- **工具列**：移動、縮放、文字三種操作模式
- **歷史紀錄**：撤銷 / 重做（上限 6 步）
- **魔法棒放大**：選取卡面背景或指定圖層，以 ESRGAN 模型進行 2x / 4x 解析度放大
- **匯出**：可設定尺寸、格式（JPG）、解析度（DPI）、檔名後下載

## 卡面規格

```
85.6 × 54 mm @ 300dpi = 1011 × 638 px（橫面）
638 × 1011 px（豎面）
圓角半徑 38px
```

## 快速開始

### 環境需求

- Node.js >= 18
- npm

### 安裝與運行

```bash
# 安裝依賴
npm install

# 啟動開發伺服器（http://127.0.0.1:5173）
npm run dev

# 建構生產版本
npm run build

# 預覽建構結果
npm run preview
```

## 專案結構

```
card/
├── public/
│   └── models/esrgan-slim/       # ESRGAN 放大模型權重（x2 / x4）
├── src/
│   ├── components/
│   │   ├── ui/                    # 基礎 UI 元件（PillButton, IconButton, PillModal, ToastStack）
│   │   ├── modals/                # 彈窗元件（聲明, 匯出, 裁切, 放大, 確認）
│   │   ├── AppHeader.vue          # 頂部導覽列
│   │   ├── ToolRail.vue           # 左側工具列
│   │   ├── ActionBar.vue          # 操作列（撤銷 / 重做 / 清空）
│   │   ├── CanvasStage.vue        # 畫布舞台
│   │   ├── LayerPanel.vue         # 右側圖層面板
│   │   ├── LayerRow.vue           # 圖層列表項
│   │   └── BackgroundInspector.vue # 卡面背景檢查面板
│   ├── composables/               # Composition API 邏輯封裝
│   │   ├── useCanvas.js           # Fabric.js 畫布管理
│   │   ├── useLayers.js           # 圖層狀態管理
│   │   ├── useBackground.js        # 卡面背景管理
│   │   ├── useTools.js            # 工具切換
│   │   ├── useViewport.js         # 視角縮放與平移
│   │   ├── useHistory.js          # 撤銷 / 重做歷史
│   │   └── useModals.js           # 彈窗開關狀態
│   ├── services/                  # 業務邏輯服務
│   │   ├── importer.js            # 素材匯入
│   │   ├── exporter.js            # 卡面匯出
│   │   ├── cropper.js             # 裁切邏輯
│   │   ├── upscaler.js            # 放大調度
│   │   ├── upscaler.worker.js     # Web Worker 放大執行
│   │   ├── jpegDpi.js             # JPEG DPI 寫入
│   │   └── objectStyle.js         # Fabric 物件樣式工具
│   ├── constants/
│   │   ├── card.js                # 卡面規格、工具定義、匯出選項等
│   │   ├── copy.js                # 介面文案集中管理（繁體中文）
│   │   ├── icons.js               # MDI 圖示本地註冊
│   │   └── tokens.js              # 設計 token（色票）
│   ├── App.vue                    # 根元件
│   ├── main.js                    # 應用進入點
│   └── style.css                  # 全域樣式 + Tailwind 主題
├── index.html
├── vite.config.js
└── package.json
```

## 設計約定

- **介面語言**：繁體中文，文案統一管理於 `src/constants/copy.js`，不引入 i18n 框架
- **色票**：定義於 `src/constants/tokens.js` 與 `src/style.css` 的 `@theme` 區塊，兩處保持同步
- **圖示**：全部使用 MDI 圖集，透過 `@iconify-json/mdi` 本地打包，執行期不向 CDN 取圖
- **畫布**：fabric 產生的外層容器固定貼齊畫布工作區左上角（見 `style.css` 中的 `.canvas-container`）
- **歷史紀錄上限**：6 步（`MAX_HISTORY_STEPS`）
- **背景存放倍率**：裁切後的卡面背景以 2 倍解析度存放，保留後續放大畫質

## 授權

私有專案，未公開授權。
