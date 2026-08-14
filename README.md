# 馬券生成器 v2

純 HTML、CSS 與 ES module 的 Canvas 馬券生成器。預覽使用 `860 x 540` Canvas，下載時輸出 `1720 x 1080` 的 2 倍 PNG。

`images/URA logo.svg` 會先由瀏覽器載入，再使用 Canvas `drawImage()` 繪製成浮水印，並包含在 PNG 輸出中。

## 目前功能

- 自由輸入賽事與投注內容
- 應援券與單勝模式
- Canvas 即時預覽
- 固定或自訂 QR Code
- 自訂圖片：上傳、移除、縮放、旋轉、透明度、圖層與拖曳
- PNG 下載完成提示

## 新增投注類型

新增類型時，請把它視為一個獨立的排版設定，不要直接重用另一種投注類型的座標。主要修改位置是：

- `index.html`：新增投注類型選項
- `js/app.js`：新增 `betTypeLayouts` 設定
- `js/app.js`：補上該類型需要的 Canvas 元素繪製與金額規則

### 1. 新增下拉選項

在 `index.html` 的 `#betType` 加入唯一的 value：

```html
<option value="umaren">馬連</option>
```

`value` 必須和 `betTypeLayouts` 的 key 完全相同。

### 2. 建立獨立排版設定

在 `js/app.js` 的 `betTypeLayouts` 新增一組設定。可以從 `ticketLayout.bet` 作為基礎，再明確覆寫這個投注類型需要的每個位置：

```js
const betTypeLayouts = {
	ouen: {
		...ticketLayout.bet,
		showEncouragement: true,
		totalMultiplier: 2
	},
	tansho: {
		...ticketLayout.bet,
		typeBox: { x: 240, y: 25, width: 76, height: 330 },
		singleFirst: { x: 278, y: 174, width: 64, size: 29 },
		singleSecond: { x: 278, y: 206, width: 64, size: 29 },
		showEncouragement: false,
		totalMultiplier: 1
	},
	umaren: {
		typeBox: { x: 230, y: 25, width: 92, height: 330 },
		typeTitle: { text: "馬連", x: 276, y: 185, width: 82, size: 30 },
		numberBox: { x: 340, y: 137, width: 54, height: 55 },
		number: { x: 367, y: 165, width: 45, size: 29 },
		cast: { x: 410, y: 156, width: 270, size: 34 },
		character: { x: 700, y: 212, width: 280, size: 18, align: "right" },
		amount: { x: 700, y: 365, width: 295, size: 28, align: "right" },
		total: { x: 700, y: 422, width: 295, size: 28, align: "right" },
		showEncouragement: false,
		totalMultiplier: 1
	}
};
```

如果新類型的元素位置和既有類型不同，請建立新的物件欄位，不要在 `drawTicket()` 裡散落座標數字。`ticketLayout` 適合放所有類型共用的基準，`betTypeLayouts` 則放投注類型專屬內容。

### 3. 加入專屬 Canvas 元素

目前 `drawTicket()` 會先取得目前類型的設定：

```js
const bet = betTypeLayouts[state.betType] || betTypeLayouts.ouen;
```

接著依 layout 繪製。若新類型有獨有元素，使用 layout 的旗標或欄位控制顯示：

```js
if (bet.typeTitle) {
	text(
		bet.typeTitle.text,
		bet.typeTitle.x,
		bet.typeTitle.y,
		bet.typeTitle.width,
		bet.typeTitle.size,
		{ align: "center", font: "Noto Serif JP", weight: 900 }
	);
}
```

不要使用只檢查 `state.betType === "ouen"` 的方式處理所有未來類型。應改成像 `showEncouragement` 這種 layout 設定，讓每種類型自行描述要顯示哪些元素。

### 4. 加入金額規則

每個 layout 都要設定 `totalMultiplier`。例如單勝與馬連是 1，應援券是 2：

```js
const total = state.amount * bet.totalMultiplier;
```

若新投注類型的合計金額不是單純倍數，請把規則抽成函式，而不是把計算寫在 Canvas 繪製程式中：

```js
const betRules = {
	ouen: (amount) => amount * 2,
	tansho: (amount) => amount,
	umaren: (amount) => amount
};

const total = betRules[state.betType](state.amount);
```

### 5. 新增後的檢查清單

1. 選項的 `value` 和 `betTypeLayouts` key 相同。
2. 新類型有獨立的框、文字、名稱與金額位置。
3. 不需要的元素不會殘留，例如 `複勝`、`PLACE/SHOW` 或 `がんばれ！`。
4. 單勝以外的金額規則沒有被誤套用。
5. 切換新類型與既有類型時，Canvas 都會重新繪製。
6. 長文字不會超出設定寬度。
7. 自訂圖片、QR Code 與浮水印仍然存在。
8. PNG 下載仍為 `1720 x 1080`，且包含新類型的完整內容。
9. 在 `http://127.0.0.1:5500/index.html` 重新整理後，瀏覽器 console 沒有錯誤。

## 檔案結構

- `index.html`：表單與 Canvas 容器
- `css/style.css`：簡約介面與控制項樣式
- `js/app.js`：狀態、QR、Canvas renderer、圖片與下載功能
- `images/URA logo.svg`：Canvas 浮水印來源
