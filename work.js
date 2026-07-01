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
const csvBtn = document.getElementById("csvBtn");

const machineInput = document.getElementById("machine");

const modal = document.getElementById("machineModal");
const modalCurrent = document.getElementById("modalCurrentMachine");
const modalNew = document.getElementById("modalNewMachine");
const cancelBtn = document.getElementById("cancelMachineChange");
const confirmBtn = document.getElementById("confirmMachineChange");

/* =========================
   ID
========================= */
function getDocId() {
  const partNo = document.getElementById("partNo").textContent || "UNKNOWN";
  const serial = document.getElementById("serial").textContent || "000";
  return `${partNo}_${serial}`;
}

/* =========================
   保存
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
    processes: cards.map(card => ({
      process: card.querySelector(".process-select").value,
      before: card.querySelector(".before-size").value,
      target: card.querySelector(".target-size").value,
      amount: card.querySelector(".amount").value,
      after: card.querySelector(".after-size").value
    }))
  };

  await setDoc(ref, data);
}

/* =========================
   カード
========================= */
function createCard() {
  const card = document.createElement("section");
  card.className = "card";

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

  const calc = () => {
    const t = parseFloat(target.value || 0);
    const a = parseFloat(amount.value || 0);
    after.value = (t + a).toFixed(3);
  };

  amount.addEventListener("input", calc);
  target.addEventListener("input", calc);

  card.querySelector(".start-btn").addEventListener("click", async () => {
    await saveAll();
    alert("保存（開始）");
  });

  card.querySelector(".end-btn").addEventListener("click", async () => {
    await saveAll();
    alert("保存（終了）");
  });
}

/* =========================
   追加
========================= */
function addCard() {
  const card = createCard();
  cards.push(card);
  cardContainer.appendChild(card);
}

/* =========================
   スクロール
========================= */
function scroll(i) {
  const w = cardContainer.clientWidth;
  cardContainer.scrollTo({ left: w * i, behavior: "smooth" });
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
  updateMachine();
});

function updateMachine() {
  const last = cards[cards.length - 1];
  if (!last) return;
  last.querySelector(".card-machine").textContent = currentMachine;
}

/* =========================
   CSV出力（ここが今回追加）
========================= */
csvBtn.addEventListener("click", () => {
  let csv = [];

  csv.push("図番,シリアル,設備,加工名,現寸法,狙い値,加工量,加工後寸法");

  const partNo = document.getElementById("partNo").textContent;
  const serial = document.getElementById("serial").textContent;

  cards.forEach(card => {
    csv.push([
      partNo,
      serial,
      currentMachine,
      card.querySelector(".process-select").value,
      card.querySelector(".before-size").value,
      card.querySelector(".target-size").value,
      card.querySelector(".amount").value,
      card.querySelector(".after-size").value
    ].join(","));
  });

  const blob = new Blob([csv.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${partNo}_${serial}_MPL.csv`;
  a.click();

  URL.revokeObjectURL(url);
});

/* =========================
   UI
========================= */
addCardBtn.addEventListener("click", addCard);

listBtn.addEventListener("click", () => {
  const i = parseInt(prompt("カード番号"));
  if (!isNaN(i)) scroll(i);
});

/* =========================
   初期化
========================= */
async function init() {
  machineInput.value = currentMachine;

  const restore = sessionStorage.getItem("mpl_restore");

  if (restore) {
    const data = JSON.parse(restore);
    sessionStorage.removeItem("mpl_restore");

    document.getElementById("partNo").textContent = data.partNo;
    document.getElementById("serial").textContent = data.serial;
    document.getElementById("operator").value = data.operator || "";
    document.getElementById("machine").value = data.machine || "";
    document.getElementById("jig").value = data.jig || "";

    currentMachine = data.machine;

    cards = [];
    cardContainer.innerHTML = "";

    (data.processes || []).forEach(() => {
      addCard();
    });

    return;
  }

  addCard();
}

init();
