// =========================
// Firebase 初期化（ここは自分の設定に差し替え）
// =========================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// =========================
// 状態管理
// =========================
let currentPage = "home";

let currentProduct = {
  id: null,
  drawingNo: "",
  serial: "",
  operator: "未設定",
  equipment: "M-1",
  processes: []
};

let pendingEquipment = null;

// =========================
// 画面切替
// =========================
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
  currentPage = pageId;
}

function goHome() {
  showPage("homePage");
}

function goContinue() {
  showPage("continuePage");
  loadProcessList();
}

function goNewProcess() {
  createNewProduct();
  showPage("workPage");
}

function goCsv() {
  alert("CSV出力は次フェーズで実装");
}

// =========================
// 新規作成
// =========================
function createNewProduct() {
  currentProduct = {
    id: Date.now().toString(),
    drawingNo: "A-001",
    serial: "0001",
    operator: "作業者A",
    equipment: "M-1",
    processes: []
  };

  document.getElementById("drawingNo").innerText = currentProduct.drawingNo;
  document.getElementById("serialNo").innerText = currentProduct.serial;
  document.getElementById("operator").innerText = currentProduct.operator;
  document.getElementById("equipmentSelect").value = currentProduct.equipment;

  renderCards();
}

// =========================
// カード追加
// =========================
function addCard() {
  const newProcess = {
    id: Date.now().toString(),
    equipment: currentProduct.equipment,
    processName: "",
    target: "",
    amount: "",
    actual: "",
    start: "",
    end: "",
    status: "not_started"
  };

  currentProduct.processes.push(newProcess);
  renderCards();
}

// =========================
// カード描画
// =========================
function renderCards() {
  const container = document.getElementById("cardContainer");
  container.innerHTML = "";

  currentProduct.processes.forEach((p, index) => {

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-grid">

        <div>
          <label>設備</label>
          <div>${p.equipment}</div>
        </div>

        <div>
          <label>加工名</label>
          <select onchange="updateProcess(${index}, 'processName', this.value)">
            <option value="">選択</option>
            <option>M-貫通穴</option>
            <option>M-止め穴</option>
            <option>M-ザグリ</option>
            <option>M-補正</option>
            <option>Y-Z面</option>
            <option>Y-半Z面</option>
            <option>E-通常</option>
          </select>
        </div>

        <div>
          <label>狙い値</label>
          <input type="number" value="${p.target}"
            onchange="updateProcess(${index}, 'target', this.value)">
        </div>

        <div>
          <label>加工量</label>
          <input type="number" value="${p.amount}"
            onchange="updateProcess(${index}, 'amount', this.value)">
        </div>

        <div class="full">
          <label>測定値</label>
          <input type="number" value="${p.actual}"
            onchange="updateProcess(${index}, 'actual', this.value)">
        </div>

        <div>
          <button onclick="startProcess(${index})">開始</button>
        </div>

        <div>
          <button onclick="endProcess(${index})">終了</button>
        </div>

      </div>
    `;

    container.appendChild(card);
  });
}

// =========================
// カード更新
// =========================
function updateProcess(index, key, value) {
  currentProduct.processes[index][key] = value;
}

// =========================
// 開始
// =========================
function startProcess(index) {
  const p = currentProduct.processes[index];

  p.start = new Date().toISOString();
  p.status = "in_progress";

  saveToFirestore();
  renderCards();
}

// =========================
// 終了
// =========================
function endProcess(index) {
  const p = currentProduct.processes[index];

  if (!p.actual) {
    alert("測定値を入力してください");
    return;
  }

  p.end = new Date().toISOString();
  p.status = "done";

  saveToFirestore();
  renderCards();
}

// =========================
// 設備変更（重要ロジック）
// =========================
function onEquipmentChange(newEq) {
  if (newEq === currentProduct.equipment) return;

  pendingEquipment = newEq;

  document.getElementById("currentEq").innerText = currentProduct.equipment;
  document.getElementById("newEq").innerText = newEq;

  document.getElementById("equipmentModal").classList.remove("hidden");
}

function cancelEquipmentChange() {
  document.getElementById("equipmentSelect").value = currentProduct.equipment;
  document.getElementById("equipmentModal").classList.add("hidden");
  pendingEquipment = null;
}

function confirmEquipmentChange() {
  currentProduct.equipment = pendingEquipment;

  document.getElementById("equipmentModal").classList.add("hidden");
  pendingEquipment = null;

  // 次のカード以降に反映される
  addCard();
  renderCards();

  saveToFirestore();
}

// =========================
// Firestore保存
// =========================
function saveToFirestore() {
  db.collection("products").doc(currentProduct.id).set(currentProduct);
}

// =========================
// 続きから一覧
// =========================
function loadProcessList() {
  const container = document.getElementById("processList");
  container.innerHTML = "";

  db.collection("products").get().then(snapshot => {

    snapshot.forEach(doc => {
      const data = doc.data();

      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <div>
          <b>${data.drawingNo}</b> / ${data.serial}
        </div>
        <div>設備：${data.equipment}</div>
        <button onclick="openProduct('${doc.id}')">続き</button>
      `;

      container.appendChild(div);
    });

  });
}

// =========================
// 再開
// =========================
function openProduct(id) {
  db.collection("products").doc(id).get().then(doc => {
    currentProduct = doc.data();

    document.getElementById("drawingNo").innerText = currentProduct.drawingNo;
    document.getElementById("serialNo").innerText = currentProduct.serial;
    document.getElementById("operator").innerText = currentProduct.operator;
    document.getElementById("equipmentSelect").value = currentProduct.equipment;

    showPage("workPage");
    renderCards();
  });
}
