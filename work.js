let cards = [];
let currentMachine = "M-1";
let tempMachine = null;

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
   初期カード生成
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

  amount.addEventListener("input", () => {
    const t = parseFloat(target.value || 0);
    const a = parseFloat(amount.value || 0);
    after.value = (t + a).toFixed(3);
  });

  target.addEventListener("input", () => {
    const t = parseFloat(target.value || 0);
    const a = parseFloat(amount.value || 0);
    after.value = (t + a).toFixed(3);
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
   横スワイプ制御
========================= */
function scrollToCard(index) {
  const width = cardContainer.clientWidth;
  cardContainer.scrollTo({
    left: width * index,
    behavior: "smooth"
  });
}

/* =========================
   設備変更処理
========================= */
machineInput.addEventListener("change", () => {
  const newMachine = machineInput.value;

  if (!newMachine || newMachine === currentMachine) return;

  tempMachine = newMachine;

  modalCurrent.textContent = currentMachine;
  modalNew.textContent = newMachine;

  modal.classList.remove("hidden");
});

/* キャンセル */
cancelBtn.addEventListener("click", () => {
  machineInput.value = currentMachine;
  tempMachine = null;
  modal.classList.add("hidden");
});

/* 変更確定 */
confirmBtn.addEventListener("click", () => {
  currentMachine = tempMachine;
  modal.classList.add("hidden");

  // 新カードを自動追加（重要仕様）
  addCard();

  updateAllCardMachines();
});

/* 全カードの表示更新（過去は変えない） */
function updateAllCardMachines() {
  const lastCard = cards[cards.length - 1];
  if (!lastCard) return;

  const machineLabel = lastCard.querySelector(".card-machine");
  machineLabel.textContent = currentMachine;
}

/* =========================
   ＋追加ボタン
========================= */
addCardBtn.addEventListener("click", () => {
  addCard();
});

/* =========================
   一覧ジャンプ（簡易）
========================= */
listBtn.addEventListener("click", () => {
  const target = prompt("カード番号へ移動（0〜）");
  const index = parseInt(target);

  if (isNaN(index)) return;
  if (index < 0 || index >= cards.length) return;

  scrollToCard(index);
});

/* =========================
   初期起動
========================= */
function init() {
  machineInput.value = currentMachine;
  addCard(); // 初期カード1枚
}

init();
