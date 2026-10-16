// mobile toggle
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

menuToggle.setAttribute("aria-expanded", "false");

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}

menuToggle.addEventListener("click", () => {
  const open = sidebar.classList.toggle("open");
  overlay.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
});
overlay.addEventListener("click", closeSidebar);

sidebar.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    if (window.innerWidth <= 900) closeSidebar();
  });
});

// scrollspy — sidebar links are deep paths ("folder/page.html#sN"),
// so match on the fragment at the END of the href
const sections = document.querySelectorAll("h2[id]");
const navLinks = sidebar.querySelectorAll("a");

function highlight() {
  let current = "";
  sections.forEach((sec) => {
    if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
  });
  navLinks.forEach((link) => {
    link.classList.toggle(
      "active",
      current !== "" && link.getAttribute("href").endsWith("#" + current),
    );
  });
}

window.addEventListener("scroll", highlight);
window.addEventListener("load", highlight);

// ── copy buttons for every code block ──────────────────────────
const copyText = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
};

document.querySelectorAll("main pre").forEach((pre) => {
  const codeEl = pre.querySelector("code") || pre;
  const originalText = codeEl.textContent;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "copy-btn";
  btn.textContent = "copy";
  btn.setAttribute("aria-label", "Copy code");
  pre.appendChild(btn);

  btn.addEventListener("click", async () => {
    try {
      await copyText(originalText);
      btn.textContent = "copied";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = "copy";
        btn.classList.remove("copied");
      }, 1500);
    } catch (err) {
      btn.textContent = "error";
    }
  });
});

// ── sidebar search: filter sections by title + content ──────────
const searchInput = document.getElementById("navSearch");
const searchCount = document.getElementById("searchCount");
const searchEmpty = document.getElementById("searchEmpty");
const navList = document.getElementById("navList");
const topItems = Array.from(navList.querySelectorAll(":scope > li"));

const textOf = (el) => (el ? el.textContent.toLowerCase() : "");

// resolve "#sN" at the END of any href (deep links across pages);
// returns null when the section lives on another page (title-only match)
const sectionFor = (link) => {
  const href = link ? link.getAttribute("href") : "";
  const id = href.includes("#") ? href.slice(href.indexOf("#") + 1) : "";
  return id ? document.getElementById(id) : null;
};

function filterNav() {
  const q = searchInput.value.trim().toLowerCase();
  let visible = 0;

  topItems.forEach((li) => {
    const link = li.querySelector(":scope > a");
    const linkText = textOf(link);
    // whole item text = title + (on the hub) the description after the link
    const itemText = textOf(li);
    const sectionText = textOf(sectionFor(link));
    let subAny = false;

    // nested sub-links (TypeScript A / B): match on their own anchor;
    // keep them reachable when only a sub-link matches
    li.querySelectorAll(":scope > ul > li").forEach((sub) => {
      const subLink = sub.querySelector("a");
      const subMatch =
        !q ||
        itemText.includes(q) ||
        textOf(subLink).includes(q) ||
        textOf(sectionFor(subLink)).includes(q);
      sub.hidden = !subMatch;
      if (subMatch) subAny = true;
    });

    const match =
      !q ||
      linkText.includes(q) ||
      itemText.includes(q) ||
      sectionText.includes(q) ||
      subAny;

    li.hidden = !match;
    if (match) visible++;
  });

  searchEmpty.hidden = visible > 0;
  searchCount.textContent = q ? visible + "/" + topItems.length : "";
}

searchInput.addEventListener("input", filterNav);
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const first = topItems.find((li) => !li.hidden);
    const target = first ? first.querySelector("a") : null;
    if (target) {
      target.click();
      searchInput.blur();
    }
  } else if (e.key === "Escape") {
    searchInput.value = "";
    filterNav();
    searchInput.blur();
  }
});

// Escape also closes the open mobile sidebar
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sidebar.classList.contains("open")) closeSidebar();
});
