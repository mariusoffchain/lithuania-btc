const filters = [...document.querySelectorAll("[data-filter]")];
for (const b of filters)
  b.onclick = () => {
    for (const f of filters) f.setAttribute("aria-pressed", String(f === b));
    for (const c of document.querySelectorAll("[data-category]"))
      c.hidden =
        b.dataset.filter !== "all" && c.dataset.category !== b.dataset.filter;
  };
const photos = [...document.querySelectorAll("[data-photo] img")],
  dialog = document.querySelector("#ecosystem-gallery");
let index = 0;
function show(i) {
  index = (i + photos.length) % photos.length;
  const img = dialog.querySelector("img");
  img.src = photos[index].src;
  img.alt = photos[index].alt;
  dialog.querySelector(".photo-caption").textContent = img.alt;
  dialog.querySelector(".photo-count").textContent =
    `${index + 1} / ${photos.length}`;
}
for (const [i, img] of photos.entries())
  img.parentElement.onclick = () => {
    show(i);
    dialog.showModal();
  };
dialog.querySelector("[data-close]").onclick = () => dialog.close();
dialog.querySelector("[data-prev]").onclick = () => show(index - 1);
dialog.querySelector("[data-next]").onclick = () => show(index + 1);
dialog.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    show(index - 1);
  }
  if (e.key === "ArrowRight") {
    e.preventDefault();
    show(index + 1);
  }
});
let startX;
dialog.addEventListener(
  "touchstart",
  (e) => {
    startX = e.changedTouches[0].clientX;
  },
  { passive: true },
);
dialog.addEventListener(
  "touchend",
  (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
  },
  { passive: true },
);
document
  .querySelector(".mobile-ecosystem")
  ?.setAttribute("aria-current", "page");
