const CART_KEY = "mini_market_cart_v1";

/* ---------- storage ---------- */
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

/* ---------- ui helpers ---------- */
function updateCartBadge() {
  const el = document.getElementById("cartCount");
  if (!el) return;
  el.textContent = String(cartCount());
}

function formatPrice(num) {
  const n = Number(num) || 0;
  return n.toLocaleString("ru-RU");
}

function calcTotal(cart) {
  return Object.values(cart).reduce((sum, item) => {
    return sum + (Number(item.price) || 0) * (Number(item.qty) || 0);
  }, 0);
}

/* ---------- modal ---------- */
function openModal(title, message) {
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const ok = document.getElementById("modalOk");

  if (!modal || !modalTitle || !modalBody || !ok) return;

  modalTitle.textContent = title;
  modalBody.textContent = message;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  ok.focus();
}

function closeModal() {
  const modal = document.getElementById("modal");
  if (!modal) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function bindModal() {
  const modal = document.getElementById("modal");
  const ok = document.getElementById("modalOk");
  if (!modal || !ok) return;

  ok.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.dataset && ("close" in t.dataset)) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

/* ---------- cart actions ---------- */
function changeQty(id, delta) {
  const cart = getCart();
  const key = String(id);

  if (!cart[key]) return;

  cart[key].qty = (Number(cart[key].qty) || 0) + delta;

  if (cart[key].qty <= 0) {
    delete cart[key];
  }

  setCart(cart);
  render();
}

function removeItem(id) {
  const cart = getCart();
  delete cart[String(id)];
  setCart(cart);
  render();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  render();
}

/* ---------- render ---------- */
function render() {
  const cart = getCart();
  updateCartBadge();

  const status = document.getElementById("status");
  const list = document.getElementById("cartList");
  const totalEl = document.getElementById("total");

  if (!list || !totalEl) return;

  list.innerHTML = "";

  const items = Object.values(cart);

  if (items.length === 0) {
    if (status) status.textContent = "Your cart is empty.";
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "Add products from the main page.";
    list.appendChild(empty);
    totalEl.textContent = "0 sum";
    return;
  }

  if (status) status.textContent = `Items: ${items.length}`;

  for (const item of items) {
    const row = document.createElement("div");
    row.className = "cart-item";

    const img = document.createElement("img");
    img.className = "cart-item__img";
    img.alt = item.name || "Product";
    img.src = item.link || "";
    img.loading = "lazy";
    img.onerror = () => {
      img.src = "";
      img.alt = "No image";
    };

    const info = document.createElement("div");

    const name = document.createElement("p");
    name.className = "cart-item__name";
    name.textContent = item.name || "Unnamed product";

    const meta = document.createElement("div");
    meta.className = "cart-item__meta";

    const price = document.createElement("span");
    price.className = "pill";
    price.textContent = `Price: ${formatPrice(item.price)} sum`;

    const qtyPill = document.createElement("span");
    qtyPill.className = "pill";
    qtyPill.textContent = `Qty: ${item.qty}`;

    const sum = document.createElement("span");
    sum.className = "pill";
    sum.textContent = `Subtotal: ${formatPrice(
      (Number(item.price) || 0) * (Number(item.qty) || 0)
    )} sum`;

    meta.appendChild(price);
    meta.appendChild(qtyPill);
    meta.appendChild(sum);

    info.appendChild(name);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";
    actions.style.justifyContent = "flex-end";
    actions.style.flexWrap = "wrap";

    const minusBtn = document.createElement("button");
    minusBtn.className = "btn";
    minusBtn.textContent = "−";
    minusBtn.title = "Decrease quantity";
    minusBtn.addEventListener("click", () => changeQty(item.id, -1));

    const plusBtn = document.createElement("button");
    plusBtn.className = "btn";
    plusBtn.textContent = "+";
    plusBtn.title = "Increase quantity";
    plusBtn.addEventListener("click", () => changeQty(item.id, +1));

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn--danger";
    delBtn.textContent = "Remove";
    delBtn.addEventListener("click", () => removeItem(item.id));

    actions.appendChild(minusBtn);
    actions.appendChild(plusBtn);
    actions.appendChild(delBtn);

    row.appendChild(img);
    row.appendChild(info);
    row.appendChild(actions);

    list.appendChild(row);
  }

  totalEl.textContent = `${formatPrice(calcTotal(cart))} sum`;
}

/* ---------- buttons (checkout/clear) ---------- */
function bindActions() {
  const buyBtn = document.getElementById("buyBtn");
  const clearBtn = document.getElementById("clearBtn");

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      const cart = getCart();
      if (cartCount(cart) === 0) {
        openModal("Cart", "Cart is already empty 🙂");
        return;
      }
      clearCart();
      openModal("Cart", "Cart has been cleared ✅");
    });
  }

  if (buyBtn) {
    buyBtn.addEventListener("click", () => {
      const cart = getCart();
      const count = cartCount(cart);
      const total = calcTotal(cart);

      if (count === 0) {
        openModal("Cart", "Your cart is empty 🙂");
        return;
      }

      openModal(
        "Order Complete",
        `Order placed successfully ✅\nTotal: ${formatPrice(total)} sum`
      );

      localStorage.removeItem(CART_KEY);
      render();
    });
  }
}

(function init() {
  bindModal();
  bindActions();
  render();
})();
