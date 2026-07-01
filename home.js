import { db, getDocs, collection } from "./firebase.js";

const list = document.getElementById("list");

/* =========================
   読み込み
========================= */
async function load() {
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "molds"));

  snap.forEach(docItem => {
    const data = docItem.data();

    if (!data.processes) return;

    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <div>図番：${data.partNo}</div>
      <div>シリアル：${data.serial}</div>
      <div>工程数：${data.processes.length}</div>
      <div>設備：${data.machine}</div>
    `;

    div.addEventListener("click", () => {
      sessionStorage.setItem("mpl_restore", JSON.stringify(data));
      location.href = "work.html";
    });

    list.appendChild(div);
  });
}

load();
