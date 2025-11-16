import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.6";

const env = window.__SUPABASE__ || {};

if (!env.url || !env.anonKey) {
  console.warn(
    "Supabase credentials missing. Update js/config.js with your project keys."
  );
}

const supabase = createClient(env.url, env.anonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
});

const projectRef = env.url
  ? env.url.replace(/^https?:\/\//, "").split(".")[0]
  : "";
const AUTH_STORAGE_KEY = projectRef ? `sb-${projectRef}-auth-token` : null;
const PENDING_BOOKMARK_KEY = "bmarks.pendingBookmark";
const PENDING_BOOKMARK_TTL = 1000 * 60 * 10; // 10 minutes
const LANDING_PATH = "/";
const supportsBroadcast =
  typeof window !== "undefined" && "BroadcastChannel" in window;
const SESSION_CACHE_KEY = "bmarks.session";
const hasStorage =
  typeof window !== "undefined" && "localStorage" in window;
const authBroadcast = supportsBroadcast
  ? new BroadcastChannel("bmarks-auth")
  : null;
let copyToastTimeout = null;
let pendingUrlPayload = extractLaunchParamsFromUrl();
let authGuardsAttached = false;

const state = {
  session: null,
  groups: [],
  bookmarks: [],
  visibleBookmarks: [],
  filters: {
    search: "",
    groupId: null,
  },
  editingBookmarkId: null,
  groupDeleteMode: false,
  pendingGroupDeleteId: null,
  isLoadingBookmarks: false,
  bookmarkLoadError: null,
  isSavingBookmark: false,
  pendingBookmarkDeleteId: null,
  focusedBookmarkIndex: -1,
};

const ui = {
  bookmarkList: document.getElementById("bookmarkList"),
  searchInput: document.getElementById("searchInput"),
  clearSearchButton: document.getElementById("clearSearchButton"),
  groupPicker: document.querySelector(".group-picker"),
  groupDropdown: document.getElementById("groupDropdown"),
  groupOptions: document.getElementById("groupOptions"),
  groupPickerButton: document.getElementById("groupPickerButton"),
  groupForm: document.getElementById("groupForm"),
  groupNameInput: document.getElementById("groupNameInput"),
  openGroupCreator: document.getElementById("openGroupCreator"),
  openGroupDeleter: document.getElementById("openGroupDeleter"),
  groupDeleteName: document.getElementById("groupDeleteName"),
  confirmDeleteGroupButton: document.getElementById(
    "confirmDeleteGroupButton"
  ),
  bookmarkDeleteName: document.getElementById("bookmarkDeleteName"),
  confirmDeleteBookmarkButton: document.getElementById(
    "confirmDeleteBookmarkButton"
  ),
  activeGroupLabel: document.getElementById("activeGroupLabel"),
  groupSelect: document.getElementById("bookmarkGroup"),
  openBookmarkModal: document.getElementById("openBookmarkModal"),
  bookmarkModal: document.getElementById("bookmarkModal"),
  accountModal: document.getElementById("accountModal"),
  bookmarkForm: document.getElementById("bookmarkForm"),
  bookmarkContent: document.getElementById("bookmarkContent"),
  bookmarkTitle: document.getElementById("bookmarkTitle"),
  previewCard: document.getElementById("previewCard"),
  saveBookmarkButton: document.getElementById("bookmarkSubmitButton"),
  deleteBookmarkButton: document.getElementById("deleteBookmarkButton"),
  docsButton: document.getElementById("docsBtn"),
  userChip: document.getElementById("userChip"),
  userMenu: document.getElementById("userMenu"),
  userAvatar: document.getElementById("userAvatar"),
  userName: document.getElementById("userName"),
  userEmail: document.getElementById("userEmail"),
  menuUserEmail: document.getElementById("menuUserEmail"),
  accountSettingsBtn: document.getElementById("accountSettingsBtn"),
  signOutBtn: document.getElementById("signOutBtn"),
  accountForm: document.getElementById("accountForm"),
  displayNameInput: document.getElementById("displayNameInput"),
  accountInfo: document.getElementById("accountInfo"),
  copyToast: document.getElementById("copyToast"),
};

init();

async function init() {
  const session = await ensureSession();
  if (!session) return;
  bindGlobalEvents();
  await Promise.all([fetchGroups(), fetchBookmarks()]);
  applyLaunchParams();
  subscribeToRealtime();
}

async function ensureSession() {
  let session = await fetchSession();

  if (!session) {
    session = await restoreSessionFromCache();
  }

  if (!session) {
    session = await waitForInitialSession();
  }

  if (!session) {
    persistLaunchParamsIfNeeded();
    redirectToLanding();
    return null;
  }

  state.session = session;
  hydrateUserChip(session.user);
  cacheSession(session);
  clearAuthHash();
  attachAuthGuards();
  return session;
}

async function fetchSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    cacheSession(session);
  }
  return session;
}

function redirectToLanding() {
  if (typeof window === "undefined") return;
  const path = window.location.pathname || "";
  const alreadyThere =
    path.endsWith(`/${LANDING_PATH}`) || path.endsWith(LANDING_PATH);
  if (alreadyThere) return;
  window.location.replace(LANDING_PATH);
}

function attachAuthGuards() {
  if (authGuardsAttached) return;
  authGuardsAttached = true;

  supabase.auth.onAuthStateChange((event, newSession) => {
    if (event === "SIGNED_OUT") {
      state.session = null;
      broadcastAuthState(false);
      clearCachedSession();
      redirectToLanding();
      return;
    }

    if (
      event === "SIGNED_IN" ||
      event === "TOKEN_REFRESHED" ||
      event === "INITIAL_SESSION"
    ) {
      if (!newSession) return;
      state.session = newSession;
      hydrateUserChip(newSession.user);
      cacheSession(newSession);
      clearAuthHash();
      broadcastAuthState(true);
    }
  });

  if (authBroadcast) {
    authBroadcast.addEventListener("message", ({ data }) => {
      if (data?.type !== "auth") return;
      if (!data.hasSession) {
        redirectToLanding();
      } else {
        refreshSession({ allowWait: true });
      }
    });
  }

  window.addEventListener("focus", () => refreshSession({ allowWait: true }));

  if (AUTH_STORAGE_KEY) {
    window.addEventListener("storage", (event) => {
      if (event.key === AUTH_STORAGE_KEY) {
        refreshSession({ allowWait: true });
      }
    });
  }
}

function broadcastAuthState(hasSession) {
  authBroadcast?.postMessage({ type: "auth", hasSession });
}

async function refreshSession(options = {}) {
  const { allowWait = true } = options;
  let session = await fetchSession();

  if (!session && allowWait) {
    session = await waitForInitialSession(2000);
  }

  if (!session) {
    state.session = null;
    clearCachedSession();
    redirectToLanding();
    return null;
  }

  if (
    !state.session ||
    state.session.access_token !== session.access_token
  ) {
    state.session = session;
    hydrateUserChip(session.user);
    await Promise.all([fetchGroups(), fetchBookmarks()]);
  }

  cacheSession(session);
  return session;
}

function hydrateUserChip(user) {
  const avatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    user.user_metadata?.profile_picture;
  const initials = user.email
    ? user.email
        .split("@")[0]
        .split(".")
        .map((chunk) => chunk[0]?.toUpperCase() || "")
        .join("")
        .slice(0, 2)
    : "B";
  if (ui.userAvatar) {
    if (avatarUrl) {
      ui.userAvatar.innerHTML = `<img src="${avatarUrl}" alt="Avatar" />`;
    } else {
      ui.userAvatar.textContent = initials || "B";
    }
  }
  if (ui.userName) {
    ui.userName.textContent = user.user_metadata?.full_name || "BMarks user";
  }
  if (ui.userEmail) {
    ui.userEmail.textContent = user.email ?? "Unknown";
  }
  if (ui.menuUserEmail) {
    ui.menuUserEmail.textContent = user.email ?? "";
  }
  if (ui.displayNameInput) {
    ui.displayNameInput.value = user.user_metadata?.full_name || "";
  }
  if (ui.accountInfo) {
    ui.accountInfo.textContent = `Member since ${formatDate(
      user.created_at || new Date().toISOString()
    )}`;
  }
}

function bindGlobalEvents() {
  document.addEventListener("click", (event) => {
    if (
      ui.groupPicker &&
      !ui.groupPicker.contains(event.target) &&
      event.target !== ui.groupPickerButton
    ) {
      toggleGroupDropdown(false);
    }
    if (
      ui.userMenu &&
      !ui.userChip.contains(event.target) &&
      !ui.userMenu.contains(event.target)
    ) {
      toggleUserMenu(false);
    }
    document
      .querySelectorAll(".modal[aria-hidden='false']")
      .forEach((modal) => {
        if (event.target.matches("[data-close-modal]")) {
          closeModal(modal.id);
        }
      });
  });

  ui.groupPickerButton?.addEventListener("click", () => {
    const isOpen = ui.groupPicker.getAttribute("data-open") === "true";
    toggleGroupDropdown(!isOpen);
  });

  ui.openGroupCreator?.addEventListener("click", () => {
    state.groupDeleteMode = false;
    toggleGroupDeleteMode(false);
    ui.groupForm?.classList.toggle("visible");
    if (ui.groupForm?.classList.contains("visible")) {
      ui.groupNameInput?.focus();
    }
  });
  ui.openGroupDeleter?.addEventListener("click", () => {
    toggleGroupDeleteMode();
  });

  ui.groupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = ui.groupNameInput.value.trim();
    if (!name) return;
    await createGroup(name);
    ui.groupNameInput.value = "";
    ui.groupForm.classList.remove("visible");
  });

  ui.searchInput?.addEventListener("input", (event) => {
    state.filters.search = event.target.value.toLowerCase();
    state.focusedBookmarkIndex = -1;
    renderBookmarks();
  });

  ui.clearSearchButton?.addEventListener("click", () => {
    state.filters.search = "";
    if (ui.searchInput) ui.searchInput.value = "";
    state.focusedBookmarkIndex = -1;
    renderBookmarks();
  });

  ui.openBookmarkModal?.addEventListener("click", () => {
    ui.bookmarkForm?.reset();
    enterBookmarkCreateMode();
    updatePreview();
    openModal("bookmarkModal");
    ui.bookmarkContent?.focus();
  });

  ui.userChip?.addEventListener("click", () => {
    const isOpen = ui.userMenu?.getAttribute("data-open") === "true";
    toggleUserMenu(!isOpen);
  });

  ui.accountSettingsBtn?.addEventListener("click", () => {
    openModal("accountModal");
  });

  ui.docsButton?.addEventListener(
    "click",
    () => (window.location.href = "/documentaion")
  );

  ui.signOutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
  });

  ui.accountForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const displayName = ui.displayNameInput.value.trim();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName || null },
    });
    if (!error && state.session) {
      hydrateUserChip({
        ...state.session.user,
        user_metadata: {
          ...state.session.user.user_metadata,
          full_name: displayName,
        },
      });
      closeModal("accountModal");
    }
  });

  document
    .querySelectorAll("[data-close-modal]")
    .forEach((node) =>
      node.addEventListener("click", () =>
        closeModal(node.closest(".modal")?.id)
      )
    );

  ui.bookmarkForm?.addEventListener("submit", handleBookmarkSubmit);
  ui.bookmarkContent?.addEventListener("input", updatePreview);
  ui.bookmarkTitle?.addEventListener("input", updatePreview);
  ui.deleteBookmarkButton?.addEventListener("click", handleBookmarkDelete);
  ui.confirmDeleteGroupButton?.addEventListener("click", confirmDeleteGroup);
  ui.confirmDeleteBookmarkButton?.addEventListener(
    "click",
    confirmDeleteBookmark
  );
  ui.bookmarkList?.addEventListener("click", (event) => {
    const actionButton = event.target.closest(".bookmark-action");
    if (actionButton) {
      const id = actionButton.dataset.bookmarkId;
      if (!id) return;
      const row = actionButton.closest(".bookmark-row");
      const visibleIndex = Number(row?.dataset.visibleIndex ?? -1);
      if (!Number.isNaN(visibleIndex) && visibleIndex >= 0) {
        setFocusedBookmarkIndex(visibleIndex);
      }
      const bookmark = state.bookmarks.find((entry) => entry.id === id);
      if (!bookmark) return;
      if (actionButton.dataset.action === "edit") {
        startEditingBookmark(bookmark);
      } else if (actionButton.dataset.action === "delete") {
        promptDeleteBookmark(bookmark);
      }
      event.stopPropagation();
      return;
    }
    if (event.target.closest("a")) return;
    const row = event.target.closest(".bookmark-row");
    if (!row?.dataset.bookmarkId) return;
    const visibleIndex = Number(row.dataset.visibleIndex ?? -1);
    if (!Number.isNaN(visibleIndex) && visibleIndex >= 0) {
      setFocusedBookmarkIndex(visibleIndex);
    }
    const bookmark =
      state.visibleBookmarks[visibleIndex] ||
      state.bookmarks.find((entry) => entry.id === row.dataset.bookmarkId);
    if (bookmark) {
      copyBookmarkContent(bookmark);
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "Escape") {
      const openModalEl = document.querySelector(".modal[aria-hidden='false']");
      if (openModalEl) {
        closeModal(openModalEl.id);
      } else if (ui.searchInput && document.activeElement === ui.searchInput) {
        ui.searchInput.blur();
      } else if (state.filters.search) {
        state.filters.search = "";
        if (ui.searchInput) ui.searchInput.value = "";
        renderBookmarks();
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const hasOpenModal = document.querySelector(".modal[aria-hidden='false']");
    if (hasOpenModal) return;
    if (!state.visibleBookmarks.length && event.key === "ArrowDown") return;

    if (event.key === "ArrowDown") {
      if (document.activeElement === ui.searchInput) {
        event.preventDefault();
        const nextIndex =
          state.focusedBookmarkIndex >= 0
            ? Math.min(
                state.focusedBookmarkIndex + 1,
                state.visibleBookmarks.length - 1
              )
            : 0;
        setFocusedBookmarkIndex(nextIndex, { scrollIntoView: true });
        return;
      }
      if (state.focusedBookmarkIndex >= 0) {
        event.preventDefault();
        const nextIndex = Math.min(
          state.focusedBookmarkIndex + 1,
          state.visibleBookmarks.length - 1
        );
        setFocusedBookmarkIndex(nextIndex, { scrollIntoView: true });
      }
      return;
    }

    if (event.key === "ArrowUp") {
      if (state.focusedBookmarkIndex > 0) {
        event.preventDefault();
        setFocusedBookmarkIndex(state.focusedBookmarkIndex - 1, {
          scrollIntoView: true,
        });
      } else if (state.focusedBookmarkIndex === 0) {
        event.preventDefault();
        setFocusedBookmarkIndex(-1);
        focusSearchInput(true);
      }
    }
  });

  updatePreview();
  enterBookmarkCreateMode();

  document.getElementById("preferencesBtn")?.addEventListener("click", () =>
    window.alert("Preferences are coming soon.")
  );
  document.getElementById("shortcutsBtn")?.addEventListener("click", () =>
    window.alert("Keyboard shortcuts coming soon.")
  );
  ui.confirmDeleteGroupButton?.addEventListener("click", confirmDeleteGroup);
}

function toggleGroupDropdown(force) {
  if (!ui.groupPicker) return;
  const nextState =
    typeof force === "boolean"
      ? force
      : ui.groupPicker.getAttribute("data-open") !== "true";
  ui.groupPicker.setAttribute("data-open", String(nextState));
  if (!nextState) {
    state.groupDeleteMode = false;
    renderGroups();
  }
}

function toggleUserMenu(force) {
  if (!ui.userMenu) return;
  ui.userMenu.setAttribute("data-open", String(force));
}

async function fetchGroups() {
  if (!state.session) return;
  const { data, error } = await supabase
    .from("groups")
    .select("id,name,created_at")
    .eq("user_id", state.session.user.id)
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load groups", error);
    return;
  }

  state.groups = data || [];
  state.bookmarks = state.bookmarks.map((bookmark) => ({
    ...bookmark,
    groupName:
      state.groups.find((group) => group.id === bookmark.group_id)?.name ||
      null,
  }));
  renderGroups();
  renderBookmarks();
}

function renderGroups() {
  if (!ui.groupOptions) return;
  const counts = state.bookmarks.reduce(
    (acc, bookmark) => {
      const key = bookmark.group_id || "__none";
      acc[key] = (acc[key] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    },
    { all: 0 }
  );
  const options = [
    {
      id: null,
      name: "All bookmarks",
    },
    ...state.groups,
  ];
  const deleteMode = state.groupDeleteMode;

  ui.groupOptions.innerHTML = options
    .map((group) => {
      const isAll = group.id === null;
      const countLabel =
        deleteMode && group.id
          ? "×"
          : group.id
          ? counts[group.id] || 0
          : counts.all || 0;
      const tagClass =
        deleteMode && group.id ? "tag danger" : "tag muted tiny";
      return `
        <button
          type="button"
          class="group-option ${
            state.filters.groupId === group.id && !deleteMode ? "active" : ""
          } ${deleteMode ? "delete-mode" : ""}"
          data-group-id="${group.id ?? ""}"
          ${isAll && deleteMode ? "data-disabled=true" : ""}
        >
          <span>${escapeHtml(group.name)}</span>
          <span class="${tagClass}">${countLabel}</span>
        </button>
      `;
    })
    .join("");

  ui.groupOptions
    .querySelectorAll(".group-option")
    .forEach((button) =>
      button.addEventListener("click", () => {
        const groupId = button.dataset.groupId || null;
        if (state.groupDeleteMode && groupId) {
          promptDeleteGroup(groupId);
          return;
        }
        state.filters.groupId = groupId;
        state.focusedBookmarkIndex = -1;
        state.groupDeleteMode = false;
        ui.activeGroupLabel.textContent =
          state.groups.find((group) => group.id === groupId)?.name ||
          "All bookmarks";
        renderGroups();
        renderBookmarks();
        toggleGroupDropdown(false);
      })
    );

  if (ui.groupSelect) {
    ui.groupSelect.innerHTML = `<option value="">No group</option>${state.groups
      .map(
        (group) =>
          `<option value="${group.id}">${escapeHtml(group.name)}</option>`
      )
      .join("")}`;
  }

  if (ui.openGroupDeleter) {
    ui.openGroupDeleter.textContent = state.groupDeleteMode
      ? "Cancel delete"
      : "Delete group";
  }
}

function toggleGroupDeleteMode(force) {
  state.groupDeleteMode =
    typeof force === "boolean" ? force : !state.groupDeleteMode;
  if (!state.groupDeleteMode) {
    state.pendingGroupDeleteId = null;
  } else {
    ui.groupForm?.classList.remove("visible");
  }
  renderGroups();
}

function promptDeleteGroup(groupId) {
  const group = state.groups.find((entry) => entry.id === groupId);
  if (!group) return;
  state.pendingGroupDeleteId = groupId;
  if (ui.groupDeleteName) {
    ui.groupDeleteName.textContent = group.name;
  }
  openModal("deleteGroupModal");
}

async function confirmDeleteGroup() {
  const groupId = state.pendingGroupDeleteId;
  if (!state.session || !groupId) {
    closeModal("deleteGroupModal");
    return;
  }
  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId)
    .eq("user_id", state.session.user.id);
  if (error) {
    console.error("Failed to delete group", error);
    return;
  }
  state.groups = state.groups.filter((entry) => entry.id !== groupId);
  state.bookmarks = state.bookmarks.map((bookmark) => ({
    ...bookmark,
    groupName:
      state.groups.find((group) => group.id === bookmark.group_id)?.name ||
      null,
  }));
  if (state.filters.groupId === groupId) {
    state.filters.groupId = null;
    ui.activeGroupLabel.textContent = "All bookmarks";
  }
  state.focusedBookmarkIndex = -1;
  state.groupDeleteMode = false;
  state.pendingGroupDeleteId = null;
  renderGroups();
  renderBookmarks();
  closeModal("deleteGroupModal");
}

function promptDeleteBookmark(bookmark) {
  state.pendingBookmarkDeleteId = bookmark.id;
  if (ui.bookmarkDeleteName) {
    ui.bookmarkDeleteName.textContent =
      bookmark.title || bookmark.content.slice(0, 80);
  }
  openModal("deleteBookmarkModal");
}

async function confirmDeleteBookmark() {
  const bookmarkId = state.pendingBookmarkDeleteId;
  if (!bookmarkId) {
    closeModal("deleteBookmarkModal");
    return;
  }
  await deleteBookmarkById(bookmarkId);
  state.pendingBookmarkDeleteId = null;
  closeModal("deleteBookmarkModal");
}

async function createGroup(name) {
  if (!state.session) return;
  const { data, error } = await supabase
    .from("groups")
    .insert({ name, user_id: state.session.user.id })
    .select()
    .single();
  if (error) {
    console.error(error);
    return;
  }
  state.groups.push(data);
  state.bookmarks = state.bookmarks.map((bookmark) => ({
    ...bookmark,
    groupName:
      state.groups.find((group) => group.id === bookmark.group_id)?.name ||
      null,
  }));
  renderGroups();
  renderBookmarks();
  toggleGroupDeleteMode(false);
}

async function fetchBookmarks() {
  if (!state.session) return;
  state.isLoadingBookmarks = true;
  state.bookmarkLoadError = null;
  renderBookmarks();
  const { data, error } = await supabase
    .from("bookmarks")
    .select(
      "id,title,content,type,url,group_id,created_at,metadata,color_code,text_note"
    )
    .eq("user_id", state.session.user.id)
    .order("created_at", { ascending: false });

  state.isLoadingBookmarks = false;

  if (error) {
    console.error("Failed to load bookmarks", error);
    state.bookmarkLoadError = "Unable to load bookmarks.";
    renderBookmarks();
    return;
  }

  state.bookmarks = (data || []).map(normalizeBookmark);
  renderBookmarks();
}

function normalizeBookmark(raw) {
  const group = state.groups.find((group) => group.id === raw.group_id);
  return {
    ...raw,
    groupName: group?.name || null,
    metadata: raw.metadata || {},
    created_at: raw.created_at,
  };
}

function renderBookmarks() {
  if (!ui.bookmarkList) return;
  if (state.isLoadingBookmarks) {
    state.visibleBookmarks = [];
    ui.bookmarkList.innerHTML = `
      <li class="loading-state">
        <span class="spinner"></span>
        <span>Loading bookmarks…</span>
      </li>`;
    return;
  }
  if (state.bookmarkLoadError) {
    state.visibleBookmarks = [];
    ui.bookmarkList.innerHTML = `<li class="empty-state"><p>${state.bookmarkLoadError}</p></li>`;
    return;
  }
  const { search, groupId } = state.filters;
  const filtered = state.bookmarks.filter((bookmark) => {
    const matchesGroup = !groupId || bookmark.group_id === groupId;
    if (!matchesGroup) return false;
    if (!search) return true;
    const haystack = [
      bookmark.title,
      bookmark.content,
      bookmark.url,
      bookmark.groupName,
      bookmark.type,
      formatDate(bookmark.created_at),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search);
  });

  state.visibleBookmarks = filtered;

  if (!filtered.length) {
    state.focusedBookmarkIndex = -1;
    ui.bookmarkList.innerHTML = `<li class="empty-state"><p>No bookmarks yet. Tap + to add your first one.</p></li>`;
    return;
  }

  if (
    state.focusedBookmarkIndex >= filtered.length ||
    state.focusedBookmarkIndex < -1
  ) {
    state.focusedBookmarkIndex = -1;
  }

  ui.bookmarkList.innerHTML = filtered
    .map((bookmark, index) => renderBookmarkRow(bookmark, index))
    .join("");
  updateBookmarkFocusVisuals();
}

function renderBookmarkRow(bookmark, visibleIndex) {
  const iconMarkup = createIconMarkup(bookmark);
  const url = bookmark.url || (bookmark.type === "link" ? bookmark.content : "");
  const domain = url ? safeHostname(url) : "";
  const domainChip = domain
    ? `<span class="bookmark-domain">${domain}</span>`
    : "";
  const groupChip = bookmark.groupName
    ? `<span class="tag">${escapeHtml(bookmark.groupName)}</span>`
    : "";
  const metaPieces = [domainChip, groupChip].filter(Boolean);
  const metaInline = metaPieces.length
    ? `<span class="bookmark-meta-inline">${metaPieces.join("")}</span>`
    : "";
  const titleMarkup =
    bookmark.type === "link"
      ? `<a class="bookmark-title" href="${url}" target="_blank" rel="noreferrer">${escapeHtml(
          bookmark.title || domain || "Untitled link"
        )}</a>`
      : `<p class="bookmark-title">${escapeHtml(
          bookmark.title || "Saved note"
        )}</p>`;
  return `
    <li
      class="bookmark-row"
      data-bookmark-id="${bookmark.id}"
      data-visible-index="${visibleIndex}"
    >
      <div class="bookmark-main">
        ${iconMarkup}
        <div class="bookmark-copy">
          <div class="bookmark-line">${titleMarkup}${metaInline}</div>
        </div>
      </div>
      <div class="bookmark-side">
        <div class="bookmark-actions">
          <button
            type="button"
            class="bookmark-action edit"
            data-action="edit"
            data-bookmark-id="${bookmark.id}"
            aria-label="Edit bookmark"
          >
            ✎
          </button>
          <button
            type="button"
            class="bookmark-action delete"
            data-action="delete"
            data-bookmark-id="${bookmark.id}"
            aria-label="Delete bookmark"
          >
            ×
          </button>
        </div>
        <time class="bookmark-date">${formatDate(bookmark.created_at)}</time>
      </div>
    </li>
  `;
}

function setFocusedBookmarkIndex(index, options = {}) {
  const clamped =
    index < -1
      ? -1
      : Math.min(index, state.visibleBookmarks.length - 1);
  state.focusedBookmarkIndex = clamped;
  updateBookmarkFocusVisuals({
    scrollIntoView: options.scrollIntoView,
  });
}

function updateBookmarkFocusVisuals({ scrollIntoView = false } = {}) {
  if (!ui.bookmarkList) return;
  const rows = ui.bookmarkList.querySelectorAll(".bookmark-row");
  rows.forEach((row, index) => {
    if (index === state.focusedBookmarkIndex) {
      row.classList.add("is-focused");
      if (scrollIntoView) {
        row.scrollIntoView({ block: "nearest" });
      }
    } else {
      row.classList.remove("is-focused");
    }
  });
}

function focusSearchInput(select = false) {
  if (!ui.searchInput) return;
  ui.searchInput.focus();
  if (select && typeof ui.searchInput.select === "function") {
    ui.searchInput.select();
  }
}

function enterBookmarkCreateMode() {
  state.editingBookmarkId = null;
  ui.saveBookmarkButton && (ui.saveBookmarkButton.textContent = "Save Bookmark");
  ui.deleteBookmarkButton?.classList.add("is-hidden");
  ui.bookmarkTitle?.setCustomValidity("");
}

function startEditingBookmark(bookmark) {
  state.editingBookmarkId = bookmark.id;
  if (ui.bookmarkContent) ui.bookmarkContent.value = bookmark.content;
  if (ui.bookmarkTitle) ui.bookmarkTitle.value = bookmark.title || "";
  if (ui.groupSelect) ui.groupSelect.value = bookmark.group_id || "";
  ui.saveBookmarkButton && (ui.saveBookmarkButton.textContent = "Update Bookmark");
  ui.deleteBookmarkButton?.classList.remove("is-hidden");
  updatePreview();
  openModal("bookmarkModal");
  ui.bookmarkContent?.focus();
}

async function deleteBookmarkById(bookmarkId) {
  if (!bookmarkId) return;
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId);
  if (error) {
    console.error("Failed to delete bookmark", error);
    return;
  }
  state.bookmarks = state.bookmarks.filter(
    (bookmark) => bookmark.id !== bookmarkId
  );
  if (state.editingBookmarkId === bookmarkId) {
    state.editingBookmarkId = null;
  }
  state.focusedBookmarkIndex = -1;
  renderBookmarks();
  renderGroups();
  ui.bookmarkForm?.reset();
  enterBookmarkCreateMode();
}

async function copyBookmarkContent(bookmark) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(bookmark.content);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = bookmark.content;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    showCopyToast("Copied to clipboard");
  } catch (error) {
    console.warn("Unable to copy bookmark content", error);
  }
}

function showCopyToast(message) {
  if (!ui.copyToast) return;
  ui.copyToast.textContent = message;
  ui.copyToast.classList.add("show");
  clearTimeout(copyToastTimeout);
  copyToastTimeout = setTimeout(() => {
    ui.copyToast?.classList.remove("show");
  }, 1600);
}

function createIconMarkup(bookmark) {
  if (bookmark.type === "color") {
    return `<div class="bookmark-icon" style="background:${bookmark.color_code};"></div>`;
  }
  if (bookmark.type === "link") {
    const url = bookmark.url || bookmark.content;
    const domain = safeHostname(url);
    const favicon = resolveFaviconUrl(url);
    return `
      <div class="bookmark-icon">
        ${
          favicon
            ? `<img src="${favicon}" alt="${domain} favicon" loading="lazy" onerror="this.replaceWith('🌐')" />`
            : "<span>🌐</span>"
        }
      </div>
    `;
  }
  const gradient = bookmark.metadata?.gradient || gradientFromString(bookmark.id);
  return `<div class="bookmark-icon" style="background:${gradient};"></div>`;
}

async function handleBookmarkSubmit(event) {
  event.preventDefault();
  if (!state.session) return;
  if (state.isSavingBookmark) return;

  const content = ui.bookmarkContent.value.trim();
  if (!content) return;

  const detected = detectContent(content);
  let title = ui.bookmarkTitle.value.trim();

  if (!title) {
    title = await resolveTitle(detected);
  }

  if (!title) {
    ui.bookmarkTitle?.setCustomValidity(
      "Please provide a title for plain text notes."
    );
    ui.bookmarkTitle?.reportValidity();
    return;
  } else {
    ui.bookmarkTitle?.setCustomValidity("");
  }

  state.isSavingBookmark = true;
  ui.saveBookmarkButton?.setAttribute("disabled", "disabled");
  closeModal("bookmarkModal");

  try {
    const basePayload = {
      content,
      title,
      type: detected.type,
      url: detected.type === "link" ? detected.url : null,
      color_code: detected.type === "color" ? detected.color : null,
      text_note: detected.type === "text" ? content : null,
      group_id: ui.groupSelect.value || null,
      metadata: {
        domain: detected.hostname || null,
        gradient:
          detected.type === "text"
            ? gradientFromString(content)
            : undefined,
      },
    };

    let record;
    if (state.editingBookmarkId) {
      const updatePayload = { ...basePayload };
      const { data, error } = await supabase
        .from("bookmarks")
        .update(updatePayload)
        .eq("id", state.editingBookmarkId)
        .select()
        .single();
      if (error) {
        console.error("Failed to update bookmark", error);
        return;
      }
      record = data;
      state.bookmarks = state.bookmarks.map((bookmark) =>
        bookmark.id === record.id ? normalizeBookmark(record) : bookmark
      );
    } else {
      const insertPayload = {
        user_id: state.session.user.id,
        ...basePayload,
      };
      const { data, error } = await supabase
        .from("bookmarks")
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error("Failed to save bookmark", error);
        return;
      }
      record = data;
      state.bookmarks = [normalizeBookmark(record), ...state.bookmarks];
    }

    renderBookmarks();
    ui.bookmarkForm.reset();
    enterBookmarkCreateMode();
    updatePreview();
  } finally {
    state.isSavingBookmark = false;
    ui.saveBookmarkButton?.removeAttribute("disabled");
  }
}

async function handleBookmarkDelete() {
  if (!state.editingBookmarkId) return;
  const bookmark = state.bookmarks.find(
    (entry) => entry.id === state.editingBookmarkId
  );
  if (!bookmark) return;
  promptDeleteBookmark(bookmark);
}

function detectContent(value) {
  const trimmed = value.trim();
  const hexMatch = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
  const rgbMatch =
    /^(rgb|rgba|hsl|hsla)\((\s*\d+%?\s*,){2}\s*[\d.]+%?\s*(,\s*[\d.]+\s*)?\)$/i;

  if (hexMatch.test(trimmed)) {
    return {
      type: "color",
      color: trimmed.startsWith("#") ? trimmed : `#${trimmed}`,
    };
  }
  if (rgbMatch.test(trimmed)) {
    return {
      type: "color",
      color: trimmed,
    };
  }
  try {
    const normalized = /^(https?:\/\/)/i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const url = new URL(normalized);
    return {
      type: "link",
      url: url.href,
      hostname: url.hostname.replace(/^www\./, ""),
    };
  } catch (_e) {
    return {
      type: "text",
      text: trimmed,
    };
  }
}

async function resolveTitle(detected) {
  if (detected.type === "link" && detected.url) {
    const title = await fetchPageTitle(detected.url);
    return title || prettifyHostname(detected.hostname) || detected.url;
  }
  if (detected.type === "color") {
    return detected.color;
  }
  return null;
}

async function fetchPageTitle(url) {
  try {
    const normalized = /^(https?:\/\/)/i.test(url) ? url : `https://${url}`;
    const response = await fetch(`https://r.jina.ai/${normalized}`);
    if (!response.ok) return null;
    const text = await response.text();
    const match = text.match(/<title[^>]*>(.*?)<\/title>/i);
    if (match) {
      return new DOMParser()
        .parseFromString(match[1], "text/html")
        .body.textContent?.trim();
    }
  } catch (error) {
    console.warn("Unable to fetch page title", error);
  }
  return null;
}

function updatePreview() {
  if (!ui.previewCard) return;
  const content = ui.bookmarkContent.value.trim();
  const detected = detectContent(content);
  const manualTitle = ui.bookmarkTitle.value.trim();
  const title = manualTitle || autoPreviewTitle(detected);
  const titleNode = ui.previewCard.querySelector(".preview-title");
  const metaNode = ui.previewCard.querySelector(".preview-meta");
  const icon = ui.previewCard.querySelector(".preview-icon");
  if (!titleNode || !metaNode || !icon) return;
  titleNode.textContent = title;
  metaNode.textContent =
    detected.type === "link"
      ? detected.hostname || "Link"
      : detected.type === "color"
      ? detected.color
      : manualTitle
      ? "Plain text"
      : "Plain text · title required";
  if (detected.type === "color") {
    icon.style.background = detected.color;
    icon.innerHTML = "";
  } else if (detected.type === "link") {
    const domain = detected.hostname;
    const favicon = domain
      ? `https://www.google.com/s2/favicons?sz=64&domain=${domain}`
      : "";
    icon.style.background = "rgba(255,255,255,0.08)";
    icon.innerHTML = favicon ? `<img src="${favicon}" alt="">` : "🌐";
  } else {
    icon.style.background = gradientFromString(content || "text");
    icon.innerHTML = "";
  }
}

function autoPreviewTitle(detected) {
  if (detected.type === "link") {
    return prettifyHostname(detected.hostname) || "Loading title…";
  }
  if (detected.type === "color") {
    return detected.color;
  }
  return "Add a title";
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
  if (id === "bookmarkModal") {
    enterBookmarkCreateMode();
    ui.bookmarkForm?.reset();
    updatePreview();
  } else if (id === "deleteGroupModal") {
    state.pendingGroupDeleteId = null;
    state.groupDeleteMode = false;
    renderGroups();
  } else if (id === "deleteBookmarkModal") {
    state.pendingBookmarkDeleteId = null;
  }
}

function formatDate(dateInput) {
  const date = new Date(dateInput);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function gradientFromString(input = "") {
  const gradients = [
    "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    "linear-gradient(135deg, #43cea2 0%, #185a9d 100%)",
    "linear-gradient(135deg, #ff6f91 0%, #ff9671 100%)",
  ];
  const hash = [...input].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

function safeHostname(url = "") {
  try {
    const normalized = /^(https?:\/\/)/i.test(url) ? url : `https://${url}`;
    const { hostname } = new URL(normalized);
    return hostname.replace(/^www\./, "");
  } catch (_e) {
    return "";
  }
}

function prettifyHostname(hostname = "") {
  return hostname.replace(/^www\./, "");
}

function resolveFaviconUrl(link = "") {
  try {
    const normalized = /^(https?:\/\/)/i.test(link) ? link : `https://${link}`;
    const url = new URL(normalized);
    return `${url.origin}/favicon.ico`;
  } catch (_e) {
    return null;
  }
}

function subscribeToRealtime() {
  if (!state.session) return;
  supabase
    .channel("bookmarks-updates")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "bookmarks",
        filter: `user_id=eq.${state.session.user.id}`,
      },
      async () => {
        await fetchBookmarks();
      }
    )
    .subscribe();

  supabase
    .channel("groups-updates")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "groups",
        filter: `user_id=eq.${state.session.user.id}`,
      },
      async () => {
        await fetchGroups();
      }
    )
    .subscribe();
}

function waitForInitialSession(timeout = 4000) {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(null);
    }, timeout);

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "INITIAL_SESSION") {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          cleanup();
          resolve(session);
        }
      }
    );

    function cleanup() {
      subscription?.subscription?.unsubscribe();
    }
  });
}

function cacheSession(session) {
  if (!hasStorage || !session) return;
  try {
    localStorage.setItem(
      SESSION_CACHE_KEY,
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })
    );
  } catch (error) {
    console.warn("Unable to cache session", error);
  }
}

async function restoreSessionFromCache() {
  if (!hasStorage) return null;
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.access_token || !parsed?.refresh_token) return null;
    const { data, error } = await supabase.auth.setSession({
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token,
    });
    if (error) {
      clearCachedSession();
      return null;
    }
    return data.session;
  } catch (error) {
    console.warn("Unable to restore cached session", error);
    return null;
  }
}

function clearCachedSession() {
  if (!hasStorage) return;
  try {
    localStorage.removeItem(SESSION_CACHE_KEY);
  } catch (error) {
    console.warn("Unable to clear cached session", error);
  }
}

function clearAuthHash() {
  if (typeof window === "undefined") return;
  if (!window.location.hash) return;
  const url = new URL(window.location.href);
  url.hash = "";
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
}

function persistLaunchParamsIfNeeded() {
  if (!hasLaunchPayload(pendingUrlPayload)) return;
  if (!hasStorage) return;
  try {
    localStorage.setItem(
      PENDING_BOOKMARK_KEY,
      JSON.stringify({
        ...pendingUrlPayload,
        storedAt: Date.now(),
      })
    );
    pendingUrlPayload = null;
  } catch (error) {
    console.warn("Unable to cache pending bookmark params", error);
  }
}

function applyLaunchParams() {
  const storedPayload = consumePendingBookmark();
  const payload = storedPayload || pendingUrlPayload;

  if (!hasLaunchPayload(payload)) return;

  pendingUrlPayload = null;
  hydrateBookmarkFormFromPayload(payload);

  const shouldOpen =
    payload.openModal ||
    Boolean(payload.content || payload.title || payload.group);
  if (shouldOpen) {
    openModal("bookmarkModal");
    ui.bookmarkContent?.focus();
  }
  clearLaunchParamsFromUrl();
}

function hydrateBookmarkFormFromPayload(payload) {
  if (!ui.bookmarkForm) return;
  ui.bookmarkForm.reset();
  if (payload.content && ui.bookmarkContent) {
    ui.bookmarkContent.value = payload.content;
  }
  if (payload.title && ui.bookmarkTitle) {
    ui.bookmarkTitle.value = payload.title;
  }
  if (payload.group && ui.groupSelect) {
    const target = state.groups.find((group) => {
      if (group.id === payload.group) return true;
      if (!group.name) return false;
      return group.name.toLowerCase() === payload.group.toLowerCase();
    });
    if (target) {
      ui.groupSelect.value = target.id;
    }
  }
  updatePreview();
}

function consumePendingBookmark() {
  if (!hasStorage) return null;
  try {
    const raw = localStorage.getItem(PENDING_BOOKMARK_KEY);
    if (!raw) return null;
    localStorage.removeItem(PENDING_BOOKMARK_KEY);
    const parsed = JSON.parse(raw);
    if (
      parsed?.storedAt &&
      Date.now() - parsed.storedAt > PENDING_BOOKMARK_TTL
    ) {
      return null;
    }
    if (parsed) {
      delete parsed.storedAt;
    }
    return parsed;
  } catch (error) {
    console.warn("Unable to read pending bookmark params", error);
    return null;
  }
}

function clearLaunchParamsFromUrl() {
  if (!window.history?.replaceState) return;
  const url = new URL(window.location.href);
  let changed = false;
  ["content", "title", "group", "new"].forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  });
  if (!changed) return;
  const nextSearch = url.searchParams.toString();
  const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${
    url.hash
  }`;
  window.history.replaceState({}, "", nextUrl);
}

function extractLaunchParamsFromUrl() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const payload = {
    content: cleanParam(params.get("content")),
    title: cleanParam(params.get("title")),
    group: cleanParam(params.get("group")),
    openModal:
      params.has("new") ||
      ["1", "true", "yes"].includes(
        (params.get("new") || "").trim().toLowerCase()
      ),
  };
  return hasLaunchPayload(payload) ? payload : null;
}

function cleanParam(value) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function hasLaunchPayload(payload) {
  if (!payload) return false;
  return Boolean(
    payload.content || payload.title || payload.group || payload.openModal
  );
}
