const CART_KEY = "mini_market_cart_v1";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch {
    return {};
  }
}

function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function cartCount(cart = getCart()) {
  return Object.values(cart).reduce((sum, item) => sum + (item.qty || 0), 0);
}

function updateCartBadge() {
  const el = document.getElementById("cartCount");
  if (!el) return;
  el.textContent = String(cartCount());
}

function formatPrice(num) {
  // простая форматировка под RU (без валюты, можешь дописать "сум")
  const n = Number(num) || 0;
  return n.toLocaleString("ru-RU");
}

function createCard(product) {
  const card = document.createElement("article");
  card.className = "card";

  const img = document.createElement("img");
  img.className = "card__img";
  img.alt = product.name || "Товар";
  img.src = product.link || "";
  img.loading = "lazy";
  img.onerror = () => { img.src = ""; img.alt = "Нет изображения"; };

  const body = document.createElement("div");
  body.className = "card__body";

  const name = document.createElement("h3");
  name.className = "card__name";
  name.textContent = product.name || "Без названия";

  const price = document.createElement("div");
  price.className = "card__price";
  price.textContent = `${formatPrice(product.price)} сум`;

  const actions = document.createElement("div");
  actions.className = "card__actions";

  const addBtn = document.createElement("button");
  addBtn.className = "btn btn--primary";
  addBtn.textContent = "Добавить в корзину";
  addBtn.addEventListener("click", () => {
    const cart = getCart();
    const id = String(product.id);

    if (!cart[id]) {
      cart[id] = {
        id: String(product.id),
        name: product.name,
        price: Number(product.price) || 0,
        link: product.link || "",
        qty: 0
      };
    }
    cart[id].qty += 1;

    setCart(cart);
    updateCartBadge();
  });

  actions.appendChild(addBtn);

  body.appendChild(name);
  body.appendChild(price);
  body.appendChild(actions);

  card.appendChild(img);
  card.appendChild(body);

  return card;
}

async function loadProductsFromExcel() {
  const status = document.getElementById("status");
  try {
    const res = await fetch("./products.xlsx");
    if (!res.ok) throw new Error(`Не удалось загрузить products.xlsx (${res.status})`);

    const buf = await res.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });

    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    // Получаем массив объектов по заголовкам колонок
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    // Нормализация полей
    const products = rows
      .map(r => ({
        id: r.id ?? r.ID ?? r.Id,
        name: r.name ?? r.Name ?? r.NAME,
        price: r.price ?? r.Price ?? r.PRICE,
        link: r.link ?? r.Link ?? r.LINK
      }))
      .filter(p => p.id !== undefined && p.id !== null && String(p.id).trim() !== "");

    if (status) status.textContent = `Товаров: ${products.length}`;

    return products;
  } catch (e) {
    if (status) status.textContent = "Ошибка загрузки товаров. Запусти через Live Server.";
    console.error(e);
    return [];
  }
}

(async function init() {
  updateCartBadge();

  const list = document.getElementById("products");
  const products = await loadProductsFromExcel();

  if (!list) return;
  list.innerHTML = "";

  if (products.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "Нет товаров или не удалось прочитать Excel.";
    list.appendChild(empty);
    return;
  }

  for (const p of products) {
    list.appendChild(createCard(p));
  }
})();
