import { db, doc, setDoc, getDoc } from "./firebase.js";

/* =========================
   状態
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
   Firestore 保存（上書き型）
========================= */
async function saveAll() {
  const id = getDocId();
  const ref = doc(db, "molds", id);

  const data = {
    partNo: document.getElementById("partNo").textContent,
    serial: document.getElementById("serial").textContent,
    operator: document.getElementById("operator").value,
    machine: currentMachine,
    jig: document.getElementById("jig").value,
    processes: cards.map((card, i) => {
      return {
        index: i,
        machine: currentMachine,
        process: card.querySelector(".process-select").value,
        before: card.querySelector(".before-size").value,
        target: card.querySelector(".target-size").value,
        amount: card.querySelector(".amount").value,
        after: card.querySelector(".after-size").value
      };
    })
  };

  await setDoc(ref, data);
}

/* =========================
   カード生成
========================= */
function createCard(index, data = {}) {
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

  attachEvents(card);

  return card;
}

/* =========================
   イベント
========================= */
function attachEvents(card) {
  const amount = card.querySelector(".amount");
  const target = card.querySelector(".target-size");
  const after = card.querySelector(".after-size");

  function calc() {
    const t = parseFloat(target.value || 0);
    const a = parseFloat(amount.value || 0);
    after.value = (t + a).toFixed(3);
  }

  amount.addEventListener("input", calc);
  target.addEventListener("input", calc);

  card.querySelector(".start-btn").addEventListener("click", async () => {
    await saveAll();
    alert("保存しました（開始）");
  });

  card.querySelector(".end-btn").addEventListener("click", async () => {
    await saveAll();
    alert("更新しました（終了）");
  });
}

/* =========================
   カード追加
========================= */
function addCard() {
  const card = createCard(cards.length);
  cards.push(card);
  cardContainer.appendChild(card);
  scroll(cards.length - 1);
}

/* =========================
   スクロール
========================= */
function scroll(index) {
  const w = cardContainer.clientWidth;
  cardContainer.scrollTo({ left: w * index, behavior: "smooth" });
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
  updateLabels();
});

function updateLabels() {
  const last = cards[cards.length - 1];
  if (!last) return;
  last.querySelector(".card-machine").textContent = currentMachine;
}

/* =========================
   UI操作
========================= */
document.getElementById("addCardBtn").addEventListener("click", addCard);

document.getElementById("listBtn").addEventListener("click", () => {
  const i = parseInt(prompt("カード番号"));
  if (isNaN(i)) return;
  if (i < 0 || i >= cards.length) return;
  scroll(i);
});

/* =========================
   初期化
========================= */
function init() {
  machineInput.value = currentMachine;
  addCard();
}

init();
