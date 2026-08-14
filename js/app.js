import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm";

const canvas = document.querySelector("#ticketCanvas");
const context = canvas.getContext("2d");
const versionButton = document.querySelector("#versionButton");
const versionModal = document.querySelector("#versionModal");
const closeVersionButton = document.querySelector("#closeVersionButton");
const designWidth = 760;
const designHeight = 460;
const ticketLayout = {
  border: { x: 2, y: 2, width: 756, height: 456, lineWidth: 4 },
  left: {
    date: { x: 28, y: 43, width: 210, size: 24 },
    venue: { x: 28, y: 83, width: 170, size: 26 },
    raceNumberBox: { x: 28, y: 101, width: 47, height: 42 },
    raceNumber: { x: 51, y: 122, width: 40, size: 23 },
    raceLabel: { x: 84, y: 123, width: 92, size: 18 },
    raceName: { x: 28, y: 165, width: 190, size: 23, lineHeight: 27 },
    grade: { x: 28, y: 205, width: 176, size: 22 },
    qr: [{ x: 25, y: 280, size: 85 }, { x: 115, y: 280, size: 85 }],
    makerLabel: { x: 28, y: 410, width: 210, size: 15, lineHeight: 20 },
    issueDate: { x: 28, y: 435, width: 180, size: 15 }
  },
  bet: {
    typeBox: { x: 240, y: 25, width: 76, height: 330 },
    win: { x: 278, y: 45, width: 64, size: 14, weight: 900 },
    singleFirst: { x: 278, y: 95, width: 64, size: 34, weight: 900 },
    singleSecond: { x: 278, y: 135, width: 64, size: 34, weight: 900 },
    plus: { x: 278, y: 180, width: 64, size: 26, weight: 900 },
    placeFirst: { x: 278, y: 220, width: 64, size: 34, weight: 900 },
    placeSecond: { x: 278, y: 260, width: 64, size: 34, weight: 900 },
    placeLabel: { x: 278, y: 305, width: 64, size: 12, weight: 900 },
    showLabel: { x: 278, y: 322, width: 64, size: 12, weight: 900 },
    encouragementBox: { x: 340, y: 25, width: 380, height: 66 },
    encouragement: { x: 530, y: 58, width: 350, size: 48, letterSpacing: 20, scaleY: 0.85 },
    numberBox: { x: 340, y: 137, width: 76, height: 74 },
    number: { x: 378, y: 174, width: 64, size: 40 },
    cast: { x: 445, y: 170, width: 270, size: 42 },
    character: { x: 720, y: 240, width: 300, size: 28, align: "right" },
    amount: { x: 720, y: 365, width: 330, size: 28, align: "right" },
    total: { x: 720, y: 422, width: 330, size: 28, align: "right" }
  },
  watermark: { startX: 350, startY: 25, columnGap: 185, rowGap: 170, rowOffset: 60, width: 100, height: 113, rows: 3, columns: 3, opacity: 0.45 },
  customImage: { x: 330, y: 360, baseWidth: 100 }
};
const betTypeLayouts = {
  ouen: {
    ...ticketLayout.bet,
    showWin: true,
    showWinBottom: false,
    showEncouragement: true,
    totalMultiplier: 2
  },
  tansho: {
    ...ticketLayout.bet,
    showWin: true,
    showWinBottom: true,
    winBottom: { x: 278, y: 330, width: 64, size: 14, weight: 900 },
    typeBox: { ...ticketLayout.bet.typeBox, height: 330 },
    singleFirst: { ...ticketLayout.bet.singleFirst, y: 170 },
    singleSecond: { ...ticketLayout.bet.singleSecond, y: 210 },
    showEncouragement: false,
    totalMultiplier: 1
  }
};
const watermark = new Image();
watermark.src = "./images/URA%20logo.svg";
const customImage = { element: null, x: ticketLayout.customImage.x, y: ticketLayout.customImage.y, scale: 1, rotation: 0, opacity: 1, layer: "top" };
const state = {
  date: "2026-08-14", venue: "台灣", raceNumber: "11", raceName: "7th世界巡迴台灣場", grade: "(G1)",
  betType: "ouen", number: 1, amount: 100, cast: "羊宮妃娜", character: "謀勇兼備役", makerLabel: "來玩賽馬娘", themeColor: "#e2efdf", watermarkStyle: "none", customQr: false, qrUrl: "https://youtu.be/dQw4w9WgXcQ?si=jEVltP_GH3UrlKG8"
};

function closeVersionModal() { versionModal.classList.remove("is-visible"); versionModal.setAttribute("aria-hidden", "true"); }
versionButton.addEventListener("click", () => { versionModal.classList.add("is-visible"); versionModal.setAttribute("aria-hidden", "false"); });
closeVersionButton.addEventListener("click", closeVersionModal);
versionModal.addEventListener("click", (event) => { if (event.target === versionModal) closeVersionModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeVersionModal(); });

[
  "date", "venue", "raceNumber", "raceName", "grade", "betType", "number", "amount", "cast", "character", "makerLabel", "themeColor", "watermarkStyle"
].forEach((id) => {
  const input = document.querySelector(`#${id}`);
  input.value = state[id];
  input.addEventListener("input", () => { state[id] = input.type === "number" ? Number(input.value) : input.value; render(); });
});

const customQrInput = document.querySelector("#customQr");
const qrUrlInput = document.querySelector("#qrUrl");
customQrInput.addEventListener("change", () => { state.customQr = customQrInput.checked; qrUrlInput.disabled = !state.customQr; render(); });
qrUrlInput.addEventListener("input", () => { state.qrUrl = qrUrlInput.value; render(); });

function text(value, x, y, width, size, options = {}) {
  context.font = `${options.weight || 700} ${size}px "${options.font || "Noto Sans JP"}"`;
  context.fillStyle = options.color || "#1d2925";
  context.textAlign = options.align || "left";
  context.textBaseline = "middle";
  const scaleX = options.scaleX || 1;
  const scaleY = options.scaleY || 1;
  if (options.letterSpacing) {
    const characters = [...(value || "")];
    const spacing = options.letterSpacing;
    const textWidth = characters.reduce((total, character) => total + context.measureText(character).width, 0) + spacing * Math.max(0, characters.length - 1);
    let cursor = options.align === "center" ? x - textWidth / 2 : options.align === "right" ? x - textWidth : x;
    context.save();
    context.translate(x, y);
    context.scale(scaleX, scaleY);
    context.textAlign = "left";
    const scaledCursor = options.align === "center" ? -textWidth / 2 : options.align === "right" ? -textWidth : 0;
    let characterCursor = scaledCursor;
    characters.forEach((character) => { context.fillText(character, characterCursor, 0); characterCursor += context.measureText(character).width + spacing; });
    context.restore();
    return;
  }
  if (scaleX !== 1) {
    context.save();
    context.translate(x, y);
    context.scale(scaleX, scaleY);
    context.fillText(value || "", 0, 0, width / scaleX);
    context.restore();
    return;
  }
  context.fillText(value || "", x, y, width);
}

function outlineBox(x, y, width, height) {
  context.strokeStyle = "#000";
  context.lineWidth = 2;
  context.strokeRect(x, y, width, height);
}

function formatEventDate(value) {
  const [year, month, day] = value.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function formatRaceNameLines(name) {
  const specialBreaks = {
    "日本ダービー（東京優駿）": ["日本ダービー", "(東京優駿)"],
    "サウジアラビアロイヤルカップ": ["サウジアラビア", "ロイヤルカップ"],
    "朝日杯フューチュリティステークス": ["朝日杯", "フューチュリティS"],
    "阪神ジュベナイルフィリーズ": ["阪神ジュベナイル", "フィリーズ"],
    "マイルチャンピオンシップ南部杯": ["マイルチャンピオン", "シップ南部杯"],
    "マイルチャンピオンシップ": ["マイル", "チャンピオンシップ"]
  };
  if (specialBreaks[name]) return specialBreaks[name];
  if (name.length < 10) return [name];
  const suffixes = ["ステークス", "カップ", "トロフィー", "ダービー", "ハンデキャップ", "クラシック", "シリーズ", "リーグ"];
  const suffix = suffixes.find((candidate) => name.endsWith(candidate));
  if (suffix) {
    const prefix = name.slice(0, -suffix.length);
    if (prefix.length <= 9) return [prefix, suffix];
  }
  const midWord = ["ジュニア", "レディ", "サマー", "オータム", "チャレンジ"].find((candidate) => name.includes(candidate));
  if (midWord) { const index = name.indexOf(midWord); return [name.slice(0, index), name.slice(index)]; }
  return suffix ? [name.slice(0, -suffix.length), suffix] : [name];
}

function getLegacyTextScale(value, threshold = 6, baseScale = 0.9) {
  return value.length > threshold ? baseScale * threshold / value.length : baseScale;
}

function wrapCanvasText(value, maxWidth, size, font = "Noto Serif JP", weight = 900) {
  context.font = `${weight} ${size}px "${font}"`;
  const lines = [];
  let line = "";
  [...value].forEach((character) => {
    const candidate = line + character;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = character;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function createTintedWatermark(color) {
  if (!watermark.complete || !watermark.naturalWidth) return null;
  const tinted = document.createElement("canvas");
  tinted.width = watermark.naturalWidth;
  tinted.height = watermark.naturalHeight;
  const tintContext = tinted.getContext("2d");
  tintContext.drawImage(watermark, 0, 0);
  tintContext.globalCompositeOperation = "source-in";
  tintContext.fillStyle = color;
  tintContext.fillRect(0, 0, tinted.width, tinted.height);
  return tinted;
}

function drawWatermarks(color, style) {
  if (style === "none") return;
  const tintedWatermark = createTintedWatermark(color);
  if (!tintedWatermark) return;
  context.save();
  context.globalAlpha = ticketLayout.watermark.opacity;
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const { startX, startY, columnGap, rowGap, rowOffset, width, height } = ticketLayout.watermark;
      const x = startX + column * columnGap + (row % 2) * rowOffset;
      const y = startY + row * rowGap;
      context.drawImage(tintedWatermark, x, y, width, height);
    }
  }
  context.restore();
}

function drawCustomImage() {
  if (!customImage.element) return;
  const width = ticketLayout.customImage.baseWidth * customImage.scale;
  const height = width * customImage.element.naturalHeight / customImage.element.naturalWidth;
  context.save();
  context.globalAlpha = customImage.opacity;
  context.translate(customImage.x, customImage.y);
  context.rotate(customImage.rotation * Math.PI / 180);
  context.drawImage(customImage.element, -width / 2, -height / 2, width, height);
  context.restore();
}

async function createQrCanvases() {
  const fixedWebsiteUrl = "https://kangwei0988.github.io/umamusume-ticket-generator/";
  const urls = [state.customQr ? state.qrUrl.trim() : fixedWebsiteUrl, fixedWebsiteUrl];
  if (!urls[0]) throw new Error("請輸入 QR 連結。");
  return Promise.all(urls.map(async (url) => {
    const qrCanvas = document.createElement("canvas");
    await QRCode.toCanvas(qrCanvas, url, { width: 75, margin: 1, color: { dark: "#1d2925", light: "#ffffff" } });
    return qrCanvas;
  }));
}

function drawTicket(qrCanvases) {
  const { border, left } = ticketLayout;
  const bet = betTypeLayouts[state.betType] || betTypeLayouts.ouen;
  const [red, green, blue] = state.themeColor.match(/[0-9a-f]{2}/gi).map((value) => parseInt(value, 16));
  const theme = `rgb(${red}, ${green}, ${blue})`;
  const themeTransparent = `rgba(${red}, ${green}, ${blue}, ${ticketLayout.watermark.opacity})`;
  const dark = `rgb(${Math.max(0, red - 42)}, ${Math.max(0, green - 42)}, ${Math.max(0, blue - 42)})`;
  const total = state.amount * bet.totalMultiplier;
  const typeCenterX = bet.typeBox.x + bet.typeBox.width / 2;
  const typeTextWidth = bet.typeBox.width - 10;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.scale(canvas.width / designWidth, canvas.height / designHeight);
  const gradient = context.createLinearGradient(0, 0, designWidth, 0);
  gradient.addColorStop(0, "#fff"); gradient.addColorStop(0.19, "#fff"); gradient.addColorStop(0.19, themeTransparent); gradient.addColorStop(0.28, themeTransparent); gradient.addColorStop(0.28, "#fff"); gradient.addColorStop(1, "#fff");
  context.fillStyle = gradient; context.fillRect(0, 0, designWidth, designHeight); context.strokeStyle = theme; context.lineWidth = border.lineWidth; context.strokeRect(border.x, border.y, border.width, border.height);
  if (customImage.layer === "bottom") drawCustomImage();
  drawWatermarks(theme, state.watermarkStyle);
  text(formatEventDate(state.date), left.date.x, left.date.y, left.date.width, left.date.size, { font: "Noto Serif JP", weight: 400 }); text(state.venue, left.venue.x, left.venue.y, left.venue.width, left.venue.size, { font: "Noto Serif JP", weight: 800 });
  context.fillStyle = "#000"; context.fillRect(left.raceNumberBox.x, left.raceNumberBox.y, left.raceNumberBox.width, left.raceNumberBox.height); text(String(state.raceNumber), left.raceNumber.x, left.raceNumber.y, left.raceNumber.width, left.raceNumber.size, { align: "center", color: "#fff", weight: 800 }); text("レース", left.raceLabel.x, left.raceLabel.y, left.raceLabel.width, left.raceLabel.size, { font: "Noto Serif JP", weight: 800 });
  const raceLines = formatRaceNameLines(state.raceName).flatMap((line) => wrapCanvasText(line, left.raceName.width, left.raceName.size));
  raceLines.forEach((line, index) => text(line, left.raceName.x, left.raceName.y + index * left.raceName.lineHeight, left.raceName.width, left.raceName.size, { font: "Noto Serif JP", weight: 900 }));
  const gradeY = left.raceName.y + raceLines.length * left.raceName.lineHeight + 13;
  text(state.grade, left.grade.x, gradeY, left.grade.width, left.grade.size, { font: "Noto Serif JP", weight: 900 });
  left.qr.forEach((position, index) => { context.fillStyle = "#fff"; context.fillRect(position.x, position.y, position.size, position.size); context.drawImage(qrCanvases[index], position.x, position.y, position.size, position.size); });
  const makerLines = wrapCanvasText(state.makerLabel, left.makerLabel.width, left.makerLabel.size, "Noto Serif JP", 400);
  makerLines.forEach((line, index) => { const y = left.makerLabel.y - (makerLines.length - 1 - index) * left.makerLabel.lineHeight; text(line, left.makerLabel.x, y, left.makerLabel.width, left.makerLabel.size, { font: "Noto Serif JP", weight: 400, color: "#000000" }); });
  text(`${Number(state.date.slice(5, 7))}月${Number(state.date.slice(8, 10))}日`, left.issueDate.x, left.issueDate.y, left.issueDate.width, left.issueDate.size, { font: "Noto Serif JP", weight: 400 });
  outlineBox(bet.typeBox.x, bet.typeBox.y, bet.typeBox.width, bet.typeBox.height); if (bet.showWin) text("WIN", typeCenterX, bet.win.y, typeTextWidth, bet.win.size, { align: "center", weight: bet.win.weight }); if (bet.showWinBottom && bet.winBottom) text("WIN", typeCenterX, bet.winBottom.y, typeTextWidth, bet.winBottom.size, { align: "center", weight: bet.winBottom.weight });
  text("単", typeCenterX, bet.singleFirst.y, typeTextWidth, bet.singleFirst.size, { align: "center", font: "Noto Serif JP", weight: bet.singleFirst.weight }); text("勝", typeCenterX, bet.singleSecond.y, typeTextWidth, bet.singleSecond.size, { align: "center", font: "Noto Serif JP", weight: bet.singleSecond.weight });
  if (bet.showEncouragement) { text("＋", typeCenterX, bet.plus.y, typeTextWidth, bet.plus.size, { align: "center", weight: bet.plus.weight }); text("複", typeCenterX, bet.placeFirst.y, typeTextWidth, bet.placeFirst.size, { align: "center", font: "Noto Serif JP", weight: bet.placeFirst.weight }); text("勝", typeCenterX, bet.placeSecond.y, typeTextWidth, bet.placeSecond.size, { align: "center", font: "Noto Serif JP", weight: bet.placeSecond.weight }); text("PLACE", typeCenterX, bet.placeLabel.y, typeTextWidth, bet.placeLabel.size, { align: "center", weight: bet.placeLabel.weight }); text("SHOW", typeCenterX, bet.showLabel.y, typeTextWidth, bet.showLabel.size, { align: "center", weight: bet.showLabel.weight }); outlineBox(bet.encouragementBox.x, bet.encouragementBox.y, bet.encouragementBox.width, bet.encouragementBox.height); text("がんばれ！", bet.encouragement.x, bet.encouragement.y, bet.encouragement.width, bet.encouragement.size, { align: "center", font: "Noto Serif JP", weight: 800, letterSpacing: bet.encouragement.letterSpacing, scaleY: bet.encouragement.scaleY }); }
  outlineBox(bet.numberBox.x, bet.numberBox.y, bet.numberBox.width, bet.numberBox.height); text(String(state.number), bet.number.x, bet.number.y, bet.number.width, bet.number.size, { align: "center", weight: 900 }); text(state.cast, bet.cast.x, bet.cast.y, bet.cast.width, bet.cast.size, { weight: 900, scaleX: getLegacyTextScale(state.cast, 6, 1) }); text(state.character, bet.character.x, bet.character.y, bet.character.width, bet.character.size, { align: bet.character.align, font: "Noto Serif JP", weight: 900, scaleX: getLegacyTextScale(state.character, 10, 1) });
  text(`各 ☆☆☆ ${state.amount}円`, bet.amount.x, bet.amount.y, bet.amount.width, bet.amount.size, { align: bet.amount.align, font: "Noto Serif JP", weight: 400, scaleX: String(state.amount).length >= 9 ? 0.8888 : 1 }); text(`合計 ★★★★ ${total}円`, bet.total.x, bet.total.y, bet.total.width, bet.total.size, { align: bet.total.align, font: "Noto Serif JP", weight: 400, scaleX: String(total).length >= 9 ? 0.8888 : 1 });
  if (customImage.layer === "top") drawCustomImage();
  context.restore();
}

const imageInput = document.querySelector("#imageInput");
const removeImage = document.querySelector("#removeImage");
const imageControls = [
  ["imageScale", "scale", (value) => `${Number(value).toFixed(1)}x`],
  ["imageRotation", "rotation", (value) => `${value}°`],
  ["imageOpacity", "opacity", (value) => `${Math.round(Number(value) * 100)}%`],
  ["imageLayer", "layer", (value) => value]
];
function setImageControls(enabled) { imageControls.forEach(([id]) => { document.querySelector(`#${id}`).disabled = !enabled; }); removeImage.disabled = !enabled; }
imageInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const loadedImage = new Image();
    loadedImage.addEventListener("load", () => { customImage.element = loadedImage; customImage.x = ticketLayout.customImage.x; customImage.y = ticketLayout.customImage.y; customImage.scale = 1; customImage.rotation = 0; customImage.opacity = 1; customImage.layer = "top"; setImageControls(true); syncImageControls(); render(); });
    loadedImage.src = reader.result;
  });
  reader.readAsDataURL(file);
});
removeImage.addEventListener("click", () => { customImage.element = null; imageInput.value = ""; setImageControls(false); render(); });
imageControls.forEach(([id, key, format]) => { document.querySelector(`#${id}`).addEventListener("input", (event) => { customImage[key] = key === "layer" ? event.target.value : Number(event.target.value); document.querySelector(`#${key === "scale" ? "imageScaleValue" : key === "rotation" ? "imageRotationValue" : "imageOpacityValue"}`).textContent = format(event.target.value); render(); }); });
function syncImageControls() { document.querySelector("#imageScale").value = customImage.scale; document.querySelector("#imageRotation").value = customImage.rotation; document.querySelector("#imageOpacity").value = customImage.opacity; document.querySelector("#imageLayer").value = customImage.layer; document.querySelector("#imageScaleValue").textContent = `${customImage.scale.toFixed(1)}x`; document.querySelector("#imageRotationValue").textContent = `${customImage.rotation}°`; document.querySelector("#imageOpacityValue").textContent = `${Math.round(customImage.opacity * 100)}%`; }

let imageDragOffset = null;
canvas.addEventListener("pointerdown", (event) => {
  if (!customImage.element) return;
  const rect = canvas.getBoundingClientRect();
  const pointerX = (event.clientX - rect.left) * designWidth / rect.width;
  const pointerY = (event.clientY - rect.top) * designHeight / rect.height;
  imageDragOffset = { x: customImage.x - pointerX, y: customImage.y - pointerY };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!imageDragOffset || !customImage.element) return;
  const rect = canvas.getBoundingClientRect();
  customImage.x = (event.clientX - rect.left) * designWidth / rect.width + imageDragOffset.x;
  customImage.y = (event.clientY - rect.top) * designHeight / rect.height + imageDragOffset.y;
  render();
});
canvas.addEventListener("pointerup", () => { imageDragOffset = null; });

async function render() {
  try { const qrCanvases = await createQrCanvases(); if (document.fonts) { await Promise.all([document.fonts.load('400 19px "Noto Serif JP"'), document.fonts.load('700 29px "Noto Serif JP"'), document.fonts.load('900 34px "Noto Sans JP"')]); await document.fonts.ready; } drawTicket(qrCanvases); }
  catch (error) { console.error(error); }
}

watermark.addEventListener("load", render);
const downloadToast = document.querySelector("#downloadToast");
const downloadDetails = document.querySelector("#downloadDetails");
let toastTimer;
document.querySelector("#download").addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width * 2;
  exportCanvas.height = canvas.height * 2;
  const exportContext = exportCanvas.getContext("2d");
  exportContext.imageSmoothingEnabled = true;
  exportContext.imageSmoothingQuality = "high";
  exportContext.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
  exportCanvas.toBlob((blob) => {
  const filename = "uma-ticket@2x.png";
  const link = document.createElement("a");
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
  downloadDetails.textContent = `${filename} ・ ${exportCanvas.width} × ${exportCanvas.height} px`;
  downloadToast.classList.add("is-visible");
  downloadToast.setAttribute("aria-hidden", "false");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { downloadToast.classList.remove("is-visible"); downloadToast.setAttribute("aria-hidden", "true"); }, 3200);
  }, "image/png");
});
render();
