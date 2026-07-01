import { db, doc, setDoc, getDoc, updateDoc } from "./firebase.js";

/* =========================
   状態管理
========================= */
let cards = [];
let currentMachine = "M-1";
let tempMachine = null;

/* =========================
   DOM
========================= */
const cardContainer = document.getElementById("cardContainer");
const addCardBtn = document.getElementById("addCardBtn");
const listBtn = document.getElementById("listBtn");

const machineInput = document.getElementById("machine");
const operatorInput = document.getElementById("operator");
const jigInput = document.getElementById("jig");

const modal = document.getElementById("machineModal");
const modalCurrent = document.getElementById("modalCurrentMachine");
const modalNew = document.getElementById("modalNewMachine");
const cancelBtn = document.getElementById("cancelMachineChange");
const confirmBtn = document.getElementById("confirmMachineChange");

/* =========================
   Firestore ID
========================= */
function getDocId() {
  const partNo = document.getElementById("partNo").textContent || "UNKNOWN";
  const serial = document.getElementById("serial").textContent || "000";
  return `${partNo}_${serial}`;
}

/* =========================
   Firestore 保存
========================= */
async function saveStart(cardData) {
  const id = getDocId();
  const ref = doc(db, "molds", id);

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      partNo: document.getElementById("partNo").textContent,
      serial: document.getElementById("serial").textContent,
      operator: operatorInput.value,
      machine: currentMachine,
      jig: jigInput.value,
      status: "working",
      processes: []
    });
  }

  const data = (await getDoc(ref)).data();
  data.processes.push(cardData);

  await setDoc(ref, data);
}

async function finishProcess(index) {
  const id = getDocId();
  const ref = doc(db, "molds", id);

  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  data.processes[index].endTime = new Date().toISOString();

  await setDoc(ref, data);
}

/* =========================
   カード生成
========================= */
function createCard(index) {
  const card = document.createElement("section");
  card.className = "card";
  card.dataset.index = index;

  card.innerHTML = `
    <div class="card-header">
      <div class="card-machine">${currentMachine}</div>
      <div class="card-process">
        <select class="process-select">
          <option>貫通穴</option>
          <option>止め穴</option>
          <option>ザグリ</option>
          <option>補正</option>
          <option>その他</option>
        </select>
      </div>
    </div>

    <div class="card-body">
      <div class="row">
        <label>現寸法</label>
        <input type="number" class="before-size">
      </div>

      <div class="row">
        <label>狙い値</label>
        <input type="number" class="target-size">
      </div>

      <div class="row">
        <label>加工量</label>
        <input type="number" class="amount">
      </div>

      <div class="row">
        <label>加工後寸法</label>
        <input type="number" class="after-size" disabled>
      </div>
    </div>

    <div class="card-footer">
      <button class="start-btn">開始</button>
      <button class="end-btn">終了</button>
    </div>
  `;

  attachCardEvents(card);
  return card;
}

/* =========================
   カードイベント
========================= */
function attachCardEvents(card) {
  const amount = card.querySelector(".amount");
  const target = card.querySelector(".target-size");
  const after = card.querySelector(".after-size");

  amount.addEventListener("input", calc);
  target.addEventListener("input", calc);

  function calc() {
    const t = parseFloat(target.value || 0);
    const a = parseFloat(amount.value || 0);
    after.value = (t + a).toFixed(3);
  }

  /* 開始 */
  card.querySelector(".start-btn").addEventListener("click", async () => {
    const data = {
      id: Date.now(),
      machine: currentMachine,
      process: card.querySelector(".process-select").value,
      before: card.querySelector(".before-size").value,
      target: card.querySelector(".target-size").value,
      amount: card.querySelector(".amount").value,
      after: card.querySelector(".after-size").value,
      startTime: new Date().toISOString()
    };

    await saveStart(data);
  });

  /* 終了 */
  card.querySelector(".end-btn").addEventListener("click", async () => {
    await finishProcess(card.dataset.index);
  });
}

/* =========================
   カード追加
========================= */
function addCard() {
  const card = createCard(cards.length);
  cards.push(card);
  cardContainer.appendChild(card);
  scrollToCard(cards.length - 1);
}

/* =========================
   スクロール
========================= */
function scrollToCard(index) {
  const width = cardContainer.clientWidth;
  cardContainer.scrollTo({
    left: width * index,
    behavior: "smooth"
  });
}

/* =========================
   設備変更
========================= */
machineInput.addEventListener("change", () => {
  const newMachine = machineInput.value;

  if (!newMachine || newMachine === currentMachine) return;

  tempMachine = newMachine;

  modalCurrent.textContent = currentMachine;
  modalNew.textContent = newMachine;

  modal.classList.remove("hidden");
});

cancelBtn.addEventListener("click", () => {
  machineInput.value = currentMachine;
  tempMachine = null;
  modal.classList.add("hidden");
});

confirmBtn.addEventListener("click", () => {
  currentMachine = tempMachine;
  modal.classList.add("hidden");

  addCard();
  updateMachineLabel();
});

function updateMachineLabel() {
  const last = cards[cards.length - 1];
  if (!last) return;

  last.querySelector(".card-machine").textContent = currentMachine;
}

/* =========================
   UI操作
========================= */
addCardBtn.addEventListener("click", addCard);

listBtn.addEventListener("click", () => {
  const target = prompt("カード番号");
  const index = parseInt(target);

  if (isNaN(index)) return;
  if (index < 0 || index >= cards.length) return;

  scrollToCard(index);
});

/* =========================
   初期化
========================= */
function init() {
  machineInput.value = currentMachine;
  addCard();
}

init();
