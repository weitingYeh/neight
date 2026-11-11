# 紙上塔羅

一個手帳風的塔羅占卜網站。寫下問題，從 78 張牌裡挑三張，用聖三角牌陣解讀。

## 它怎麼解牌

網站有兩層解讀，可以同時存在：

- **規則引擎**（一定會有）：在瀏覽器裡跑，不花錢。它先從問題的用字判斷主題（感情、工作、金錢、學業、身心、人際）和問法（要不要做、會怎麼樣、該怎麼做），再讀整副牌的結構：大小牌比例、四元素的過與不及、相鄰牌的元素生剋、逆位與宮廷牌。輸出分成「逐張來看」（牌面、牌義、正逆位、放在問題上的意思）、「牌與牌之間」（連起來讀、互動、沒注意到的、需要留意的、總結）和一句結論。
- **Fable 即時解牌**（選用）：設定 Anthropic API 金鑰後，伺服器會把問題和牌面交給 `claude-fable-5-2`，依同樣的段落結構寫出針對問題的完整解讀。規則引擎靠關鍵字和模板，切題的程度有限；要真正讀懂問題，得靠這一層。

聖三角有兩種讀法：「時間之流」（過去・現在・未來）和「問題解析」（狀況・癥結・建議）。

抽牌要先「轉開封印」：選中牌後拖動畫面，每過一格會有聲音、震動和火花，轉滿六格才抽得出來；輕點或按 Enter 會自動轉完。音效用 Web Audio 即時合成，左上角可以關掉。

## 啟動

```bash
npm install
```

只用規則引擎：

```bash
npm start
```

加上 Fable 解牌：

```bash
ANTHROPIC_API_KEY=你的金鑰 npm start
```

打開 <http://localhost:3000>。

| 環境變數 | 預設 | 用途 |
|---|---|---|
| `ANTHROPIC_API_KEY` | 無 | 有設定才會啟用 Fable 解牌 |
| `PORT` | `3000` | 伺服器埠號 |
| `TAROT_MODEL` | `claude-fable-5-2` | 解牌用的模型 |
| `TAROT_EFFORT` | `medium` | 模型的思考深度（`low`–`max`），越高越慢越貴 |

每次 Fable 解牌都會產生 API 費用。伺服器內建簡單的流量限制：同一個 IP 十分鐘內最多問八次。

## 公開網址（GitHub Pages）

`.github/workflows/pages.yml` 會在每次推送到 `master` 時，把 `public/` 部署到 GitHub Pages。第一次使用前，要到 repo 的 Settings → Pages，把 Source 設成 **GitHub Actions**。部署完成後的網址是 `https://weitingyeh.github.io/neight/`。

Pages 是純靜態主機，所以公開網址上只有規則引擎的解讀。要讓公開網站也有 Fable 解牌，得另外把 `server.js` 部署到能跑 Node 的主機，並在那裡設定金鑰。

## 檔案

- `public/js/cards.js`：78 張牌的牌義與元素
- `public/js/engine.js`：解牌引擎，瀏覽器與伺服器共用
- `public/js/art.js`：用程式畫的原創 SVG 牌面
- `public/js/app.js`：頁面流程
- `server.js`：靜態檔服務與 `/api/reading`

## 說明

大牌的元素採黃金黎明系統的星象對應；元素生剋採火風相生、水土相生、火水相剋、風土相剋的慣例。塔羅是整理思緒的工具，不是預言。
