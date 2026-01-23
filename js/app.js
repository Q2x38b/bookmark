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
const supportsSwipeInteractions =
  typeof window !== "undefined" &&
  (window.matchMedia?.("(pointer: coarse)")?.matches ||
    navigator.maxTouchPoints > 0);
const canUsePointerEvents =
  typeof window !== "undefined" && "PointerEvent" in window;
const SESSION_CACHE_KEY = "bmarks.session";
const GROUP_COLOR_STORAGE_KEY = "bmarks.groupColors";
const OFFLINE_MODE_KEY = "bmarks.offlineMode";
const OFFLINE_BOOKMARKS_KEY = "bmarks.offlineBookmarks";
const OFFLINE_GROUPS_KEY = "bmarks.offlineGroups";
const GROUP_COLOR_PALETTE = [
  "#2563EB",
  "#DB2777",
  "#10B981",
  "#F97316",
  "#F59E0B",
  "#6366F1",
  "#EC4899",
  "#14B8A6",
  "#F43F5E",
  "#84CC16",
  "#0EA5E9",
];
const hasStorage =
  typeof window !== "undefined" && "localStorage" in window;
const authBroadcast = supportsBroadcast
  ? new BroadcastChannel("bmarks-auth")
  : null;
const dataBroadcast = supportsBroadcast
  ? new BroadcastChannel("bmarks-data")
  : null;
const clientId =
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
let copyToastTimeout = null;
let pendingUrlPayload = extractLaunchParamsFromUrl();
let authGuardsAttached = false;
const realtimeChannels = [];
let realtimeRetryTimer = null;
const REALTIME_RETRY_DELAY = 4000;
let pendingDataResync = null;
let lastDataResyncAt = 0;
const DATA_RESYNC_COOLDOWN = 1500;
const BOOKMARK_IMAGE_BUCKET = "bookmark-images";
let globalDragDepth = 0;

const state = {
  session: null,
  isOffline: false,
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
  pendingGroupEditId: null,
  isGroupEditSaving: false,
  isLoadingBookmarks: false,
  bookmarkLoadError: null,
  isSavingBookmark: false,
  pendingBookmarkDeleteId: null,
  focusedBookmarkIndex: -1,
  groupColors: loadStoredGroupColors(),
  bookmarkGroupSearch: "",
  isBookmarkGroupMenuOpen: false,
  pendingImageAttachment: null,
  pendingImagePreviewUrl: null,
  pendingImageAverageColor: null,
  pendingImageDimensions: null,
  editingBookmarkType: null,
  editingImageReference: null,
};

const ui = {
  loadingView: document.getElementById("loadingView"),
  landingView: document.getElementById("landingView"),
  appView: document.getElementById("appView"),
  bookmarkList: document.getElementById("bookmarkList"),
  searchInput: document.getElementById("searchInput"),
  clearSearchButton: document.getElementById("clearSearchButton"),
  groupPicker: document.querySelector(".group-picker"),
  groupDropdown: document.getElementById("groupDropdown"),
  groupOptions: document.getElementById("groupOptions"),
  groupPickerButton: document.getElementById("groupPickerButton"),
  groupForm: document.getElementById("groupForm"),
  groupNameInput: document.getElementById("groupNameInput"),
  groupColorInput: document.getElementById("groupColorInput"),
  openGroupCreator: document.getElementById("openGroupCreator"),
  openGroupEditor: document.getElementById("openGroupEditor"),
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
  bookmarkGroupControl: document.getElementById("bookmarkGroupControl"),
  bookmarkGroupMenu: document.getElementById("bookmarkGroupMenu"),
  bookmarkGroupTrigger: document.getElementById("bookmarkGroupTrigger"),
  bookmarkGroupTriggerLabel: document.getElementById("bookmarkGroupTriggerLabel"),
  bookmarkGroupSearch: document.getElementById("bookmarkGroupSearch"),
  bookmarkGroupList: document.getElementById("bookmarkGroupList"),
  bookmarkAttachmentZone: document.getElementById("bookmarkAttachmentZone"),
  bookmarkAttachmentInput: document.getElementById("bookmarkAttachmentInput"),
  bookmarkAttachmentButton: document.getElementById("bookmarkAttachmentButton"),
  bookmarkAttachmentPreview: document.getElementById("bookmarkAttachmentPreview"),
  bookmarkAttachmentPreviewImage: document.getElementById("bookmarkAttachmentPreviewImage"),
  bookmarkAttachmentFileName: document.getElementById("bookmarkAttachmentFileName"),
  bookmarkAttachmentColor: document.getElementById("bookmarkAttachmentColor"),
  bookmarkAttachmentRemove: document.getElementById("bookmarkAttachmentRemove"),
  openBookmarkModal: document.getElementById("openBookmarkModal"),
  bookmarkModal: document.getElementById("bookmarkModal"),
  groupEditModal: document.getElementById("editGroupModal"),
  groupEditForm: document.getElementById("groupEditForm"),
  groupEditSelect: document.getElementById("groupEditSelect"),
  groupEditNameInput: document.getElementById("groupEditNameInput"),
  groupEditColorInput: document.getElementById("groupEditColorInput"),
  randomizeGroupColorButton: document.getElementById(
    "randomizeGroupColorButton"
  ),
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
    pasteBookmarkButton: document.getElementById("pasteBookmarkContent"),
    bookmarkFormReset: document.getElementById("bookmarkFormReset"),
};

dataBroadcast?.addEventListener("message", ({ data }) => {
  if (!data || data.clientId === clientId) return;
  if (data.type === "bookmarks:changed" || data.type === "groups:changed") {
    queueDataResync({ force: true });
    return;
  }
  if (data.type === "groupColors:changed") {
    refreshGroupColors(data.colors);
  }
});

init();

async function init() {
  showLoadingView();
  const session = await ensureSession();
  if (!session) {
    showLandingView();
    return;
  }
  showAppView();
  bindGlobalEvents();
  await Promise.all([fetchGroups(), fetchBookmarks()]);
  applyLaunchParams();
  if (!state.isOffline) {
    subscribeToRealtime();
  }
}

function isOfflineMode() {
  return hasStorage && localStorage.getItem(OFFLINE_MODE_KEY) === "true";
}

function createOfflineSession() {
  return {
    user: {
      id: "offline-user",
      email: "offline@local",
      user_metadata: {
        full_name: "Offline User",
        avatar_url: null,
      },
    },
    access_token: "offline",
    refresh_token: "offline",
  };
}

async function ensureSession() {
  if (isOfflineMode()) {
    const offlineSession = createOfflineSession();
    state.session = offlineSession;
    state.isOffline = true;
    hydrateUserChip(offlineSession.user);
    return offlineSession;
  }

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
  state.isOffline = false;
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
  if (path === LANDING_PATH || path.endsWith("/index.html")) {
    showLandingView();
    return;
  }
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
      unsubscribeFromRealtime();
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
      showAppView();
      subscribeToRealtime();
    }
  });

    if (authBroadcast) {
      authBroadcast.addEventListener("message", ({ data }) => {
        if (data?.type !== "auth") return;
        refreshSession({
          allowWait: true,
          redirectOnFailure: data.hasSession === false,
        });
      });
    }

    window.addEventListener("focus", () =>
      refreshSession({ allowWait: true, redirectOnFailure: false }).finally(() =>
        queueDataResync({ force: true })
      )
    );

  window.addEventListener("storage", (event) => {
    if (AUTH_STORAGE_KEY && event.key === AUTH_STORAGE_KEY) {
      refreshSession({
        allowWait: true,
        redirectOnFailure: false,
      }).finally(() => queueDataResync({ force: true }));
      return;
    }
    if (event.key === GROUP_COLOR_STORAGE_KEY) {
      refreshGroupColors(parseGroupColorPayload(event.newValue));
    }
  });
}

function broadcastAuthState(hasSession) {
  authBroadcast?.postMessage({ type: "auth", hasSession });
}

async function refreshSession(options = {}) {
  const { allowWait = true, redirectOnFailure = true } = options;
  let session = await fetchSession();

  if (!session && allowWait) {
    session = await waitForInitialSession(2000);
  }

  if (!session) {
    if (redirectOnFailure) {
      state.session = null;
      clearCachedSession();
      unsubscribeFromRealtime();
      redirectToLanding();
    }
    return null;
  }

  if (
    !state.session ||
    state.session.access_token !== session.access_token
  ) {
    state.session = session;
    hydrateUserChip(session.user);
    await Promise.all([fetchGroups(), fetchBookmarks()]);
    subscribeToRealtime();
  }

  cacheSession(session);
  showAppView();
  return session;
}

function hydrateUserChip(user) {
  const isOffline = state.isOffline;
  const avatarUrl = isOffline
    ? null
    : user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      user.user_metadata?.profile_picture;
  const initials = isOffline
    ? "OFF"
    : user.email
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
    if (isOffline) {
      ui.userAvatar.classList.add("offline-mode");
    } else {
      ui.userAvatar.classList.remove("offline-mode");
    }
  }
  if (ui.userName) {
    ui.userName.textContent = isOffline
      ? "Offline Mode"
      : user.user_metadata?.full_name || "BMarks user";
  }
  if (ui.userEmail) {
    ui.userEmail.textContent = isOffline
      ? "Data stored locally"
      : user.email ?? "Unknown";
  }
  if (ui.menuUserEmail) {
    ui.menuUserEmail.textContent = isOffline ? "Local storage only" : user.email ?? "";
  }
  if (ui.displayNameInput) {
    ui.displayNameInput.value = isOffline
      ? ""
      : user.user_metadata?.full_name || "";
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
    if (
      ui.bookmarkGroupControl &&
      !ui.bookmarkGroupControl.contains(event.target)
    ) {
      toggleBookmarkGroupMenu(false);
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
    ui.bookmarkGroupTrigger?.addEventListener("click", () => {
      const isOpen =
        ui.bookmarkGroupControl?.getAttribute("data-open") === "true";
      toggleBookmarkGroupMenu(!isOpen);
    });
    ui.bookmarkGroupSearch?.addEventListener("input", (event) => {
      state.bookmarkGroupSearch = event.target.value || "";
      renderBookmarkGroupOptions();
    });
    ui.bookmarkGroupSearch?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const firstOption =
          ui.bookmarkGroupList?.querySelector(".combo-option");
        firstOption?.click();
      }
    });
    ui.bookmarkAttachmentButton?.addEventListener("click", () => {
      ui.bookmarkAttachmentInput?.click();
    });
    ui.bookmarkAttachmentInput?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (file) {
        prepareImageAttachment(file);
        event.target.value = "";
      }
    });
    ui.bookmarkAttachmentRemove?.addEventListener("click", () => {
      clearPendingImageAttachment();
    });
    ui.bookmarkAttachmentZone?.addEventListener("dragover", (event) => {
      if (!event.dataTransfer?.types?.includes("Files")) return;
      event.preventDefault();
      event.stopPropagation();
      ui.bookmarkAttachmentZone?.classList.add("is-dragging");
    });
    ui.bookmarkAttachmentZone?.addEventListener("dragleave", (event) => {
      event.stopPropagation();
      ui.bookmarkAttachmentZone?.classList.remove("is-dragging");
    });
    ui.bookmarkAttachmentZone?.addEventListener("drop", (event) => {
      if (!event.dataTransfer?.files?.length) return;
      event.preventDefault();
      event.stopPropagation();
      ui.bookmarkAttachmentZone?.classList.remove("is-dragging");
      const file = [...event.dataTransfer.files].find((entry) =>
        entry.type.startsWith("image/")
      );
      if (file) {
        prepareImageAttachment(file);
      }
    });
    document.addEventListener("dragenter", handleGlobalDragEnter);
    document.addEventListener("dragleave", handleGlobalDragLeave);
    document.addEventListener("dragover", handleGlobalDragOver);
    document.addEventListener("drop", handleGlobalDrop);

  ui.openGroupCreator?.addEventListener("click", () => {
    state.groupDeleteMode = false;
    toggleGroupDeleteMode(false);
    ui.groupForm?.classList.toggle("visible");
    if (ui.groupForm?.classList.contains("visible")) {
      ui.groupNameInput?.focus();
      if (ui.groupColorInput) {
        ui.groupColorInput.value =
          suggestGroupColor(ui.groupNameInput?.value || "") ||
          randomGroupColor();
      }
    }
  });
  ui.openGroupDeleter?.addEventListener("click", () => {
    toggleGroupDeleteMode();
  });
  ui.openGroupEditor?.addEventListener("click", () => {
    if (!state.groups.length) {
      showCopyToast("Create a group first");
      return;
    }
    populateGroupEditor(state.filters.groupId || state.groups[0]?.id || null);
    openModal("editGroupModal");
  });

  ui.groupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = ui.groupNameInput.value.trim();
    if (!name) return;
    const colorValue = sanitizeColorValue(ui.groupColorInput?.value);
    await createGroup(name, colorValue);
    ui.groupNameInput.value = "";
    if (ui.groupColorInput) {
      ui.groupColorInput.value =
        suggestGroupColor(ui.groupNameInput.value) || randomGroupColor();
    }
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
    resetBookmarkForm({ focusContent: true });
    openModal("bookmarkModal");
  });

  ui.pasteBookmarkButton?.addEventListener("click", handlePasteBookmarkContent);

  ui.bookmarkFormReset?.addEventListener("click", () =>
    resetBookmarkForm({ focusContent: true })
  );

  ui.groupEditSelect?.addEventListener("change", () => {
    const targetId = ui.groupEditSelect?.value || "";
    if (targetId) {
      hydrateGroupEditorFields(targetId);
    }
  });

  ui.groupEditForm?.addEventListener("submit", handleGroupEditSubmit);

  ui.randomizeGroupColorButton?.addEventListener(
    "click",
    handleRandomizeGroupColorClick
  );

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
    if (state.isOffline) {
      exitOfflineMode();
      return;
    }
    await supabase.auth.signOut();
  });

  ui.accountForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.isOffline) {
      closeModal("accountModal");
      return;
    }
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
  ui.bookmarkTitle?.addEventListener("input", () => {
    ui.bookmarkTitle?.setCustomValidity("");
    updatePreview();
  });
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
    if (row?.dataset.swipeCancelClick === "true") {
      event.stopPropagation();
      return;
    }
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
        if (ui.bookmarkGroupControl?.getAttribute("data-open") === "true") {
          toggleBookmarkGroupMenu(false);
          return;
        }
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
    const hasOpenModal = document.querySelector(".modal[aria-hidden='false']");
    if (hasOpenModal) return;
    if (document.body.dataset.view !== "app") return;

    const isArrowDown = event.key === "ArrowDown";
    const isArrowUp = event.key === "ArrowUp";
    const isEnter = event.key === "Enter";

    if ((isArrowDown || isArrowUp) && !state.visibleBookmarks.length) {
      return;
    }

    if (isArrowDown) {
      event.preventDefault();
      if (state.focusedBookmarkIndex === -1) {
        setFocusedBookmarkIndex(0, { scrollIntoView: true });
        return;
      }
      const nextIndex = Math.min(
        state.focusedBookmarkIndex + 1,
        state.visibleBookmarks.length - 1
      );
      setFocusedBookmarkIndex(nextIndex, { scrollIntoView: true });
      return;
    }

    if (isArrowUp) {
      event.preventDefault();
      if (state.focusedBookmarkIndex === -1) {
        setFocusedBookmarkIndex(state.visibleBookmarks.length - 1, {
          scrollIntoView: true,
        });
        return;
      }
      if (state.focusedBookmarkIndex === 0) {
        setFocusedBookmarkIndex(-1);
        focusSearchInput(true);
        return;
      }
      setFocusedBookmarkIndex(state.focusedBookmarkIndex - 1, {
        scrollIntoView: true,
      });
      return;
    }

    if (isEnter && state.focusedBookmarkIndex >= 0) {
      const bookmark = state.visibleBookmarks[state.focusedBookmarkIndex];
      if (!bookmark) return;
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        openBookmarkLink(bookmark);
      } else {
        event.preventDefault();
        copyBookmarkContent(bookmark);
      }
    }
  });

  document.addEventListener("click", (event) => {
    if (document.body.dataset.view !== "app") return;
    if (state.focusedBookmarkIndex < 0) return;
    if (event.target.closest(".bookmark-row")) return;
    if (event.target.closest(".modal")) return;
    setFocusedBookmarkIndex(-1);
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
    document.addEventListener("visibilitychange", handleVisibilityResync);
    window.addEventListener("online", () => queueDataResync({ force: true }));
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

function toggleBookmarkGroupMenu(force) {
  if (!ui.bookmarkGroupControl || !ui.bookmarkGroupTrigger) return;
  const nextState =
    typeof force === "boolean"
      ? force
      : ui.bookmarkGroupControl.getAttribute("data-open") !== "true";
  ui.bookmarkGroupControl.setAttribute("data-open", String(nextState));
  ui.bookmarkGroupTrigger.setAttribute("aria-expanded", String(nextState));
  state.isBookmarkGroupMenuOpen = nextState;
  if (nextState) {
    state.bookmarkGroupSearch = "";
    if (ui.bookmarkGroupSearch) {
      ui.bookmarkGroupSearch.value = "";
      setTimeout(() => ui.bookmarkGroupSearch?.focus(), 0);
    }
    renderBookmarkGroupOptions();
  } else if (ui.bookmarkGroupSearch) {
    ui.bookmarkGroupSearch.blur();
  }
}

function toggleUserMenu(force) {
  if (!ui.userMenu) return;
  ui.userMenu.setAttribute("data-open", String(force));
}

async function fetchGroups() {
  if (!state.session) return;

  if (state.isOffline) {
    state.groups = getOfflineGroups();
    pruneStaleGroupColors();
    syncBookmarkGroupNames();
    renderGroups();
    renderBookmarks();
    return;
  }

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
  pruneStaleGroupColors();
  syncBookmarkGroupNames();
  renderGroups();
  renderBookmarks();
}

function computeGroupCounts() {
  return state.bookmarks.reduce(
    (acc, bookmark) => {
      const key = bookmark.group_id || "__none";
      acc[key] = (acc[key] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    },
    { all: 0 }
  );
}

function renderGroups() {
  if (!ui.groupOptions) return;
  const counts = computeGroupCounts();
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
      const name = group.name || "Untitled group";
      const color =
        !group.id || deleteMode
          ? null
          : getGroupColor(group.id, name) || null;
      const chipColor = color || "rgba(255,255,255,0.2)";
      return `
        <button
          type="button"
          class="group-option ${
            state.filters.groupId === group.id && !deleteMode ? "active" : ""
          } ${deleteMode ? "delete-mode" : ""}"
          data-group-id="${group.id ?? ""}"
          ${isAll && deleteMode ? "data-disabled=true" : ""}
        >
          <span class="group-option-content">
            <span class="group-color-chip" style="--group-color:${chipColor}"></span>
            <span class="group-option-name">${escapeHtml(name)}</span>
          </span>
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
    const previousValue = ui.groupSelect.value || "";
    ui.groupSelect.innerHTML = `<option value="">No group</option>${state.groups
      .map(
        (group) =>
          `<option value="${group.id}">${escapeHtml(group.name)}</option>`
      )
      .join("")}`;
    ui.groupSelect.value = previousValue;
    updateBookmarkGroupTriggerLabel();
  }

  if (ui.openGroupDeleter) {
    ui.openGroupDeleter.textContent = state.groupDeleteMode
      ? "Cancel delete"
      : "Delete group";
  }

  refreshGroupEditorControls();
  renderBookmarkGroupOptions(counts);
}

function renderBookmarkGroupOptions(counts) {
  if (!ui.bookmarkGroupList) return;
  const stats = counts || computeGroupCounts();
  const rawSearch = (state.bookmarkGroupSearch || "").trim();
  const normalizedSearch = rawSearch.toLowerCase();
  const selectedId = ui.groupSelect?.value || "";
  const dataset = normalizedSearch
    ? state.groups.filter((group) =>
        (group.name || "").toLowerCase().includes(normalizedSearch)
      )
    : state.groups;
  const noGroupMarkup = createBookmarkGroupOption({
    id: null,
    name: "No group",
    count: stats.__none || 0,
    isActive: !selectedId,
  });
  const groupMarkup = dataset
    .map((group) =>
      createBookmarkGroupOption({
        id: group.id,
        name: group.name || "Untitled group",
        color: getGroupColor(group.id, group.name || ""),
        count: stats[group.id] || 0,
        isActive: selectedId === group.id,
      })
    )
    .join("");
  let message = "";
  if (normalizedSearch && !dataset.length) {
    message = `<p class="combo-empty">No groups match “${escapeHtml(
      rawSearch
    )}”.</p>`;
  } else if (!state.groups.length) {
    message =
      '<p class="combo-empty">No groups yet — create one from the picker.</p>';
  }
  ui.bookmarkGroupList.innerHTML = `${noGroupMarkup}${groupMarkup}${message}`;
  ui.bookmarkGroupList
    .querySelectorAll("[data-group-option]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        const targetId = button.dataset.groupId || null;
        setBookmarkFormGroup(targetId);
        toggleBookmarkGroupMenu(false);
      })
    );
}

function createBookmarkGroupOption({
  id = null,
  name = "No group",
  color = null,
  count = 0,
  isActive = false,
}) {
  const dataId = id || "";
  const chipColor = color && id ? color : "var(--border-subtle)";
  return `
    <button
      type="button"
      class="combo-option ${isActive ? "is-active" : ""}"
      data-group-option="true"
      data-group-id="${dataId}"
    >
      <span class="combo-option-main">
        <span class="combo-color" style="--chip-color:${chipColor}"></span>
        <span class="combo-option-label">${escapeHtml(name)}</span>
      </span>
      <span class="combo-option-meta">${count}</span>
    </button>
  `;
}

function updateBookmarkGroupTriggerLabel() {
  if (!ui.bookmarkGroupTriggerLabel) return;
  const selectedId = ui.groupSelect?.value || "";
  if (!selectedId) {
    ui.bookmarkGroupTriggerLabel.textContent = "No group";
    return;
  }
  const group = state.groups.find((entry) => entry.id === selectedId);
  ui.bookmarkGroupTriggerLabel.textContent = group?.name || "No group";
}

function setBookmarkFormGroup(groupId) {
  if (!ui.groupSelect) return;
  const nextValue = groupId || "";
  ui.groupSelect.value = nextValue;
  updateBookmarkGroupTriggerLabel();
  renderBookmarkGroupOptions();
}

function refreshGroupEditorControls() {
  const hasGroups = Boolean(state.groups.length);
  if (ui.openGroupEditor) {
    ui.openGroupEditor.disabled = !hasGroups;
  }
  if (!ui.groupEditSelect) return;
  const modalOpen = ui.groupEditModal?.getAttribute("aria-hidden") === "false";
  if (modalOpen) return;
  if (!hasGroups) {
    ui.groupEditSelect.innerHTML = `<option value="">No groups yet</option>`;
    ui.groupEditSelect.setAttribute("disabled", "disabled");
    return;
  }
  ui.groupEditSelect.removeAttribute("disabled");
  ui.groupEditSelect.innerHTML = state.groups
    .map(
      (group) =>
        `<option value="${group.id}">${escapeHtml(group.name)}</option>`
    )
    .join("");
  const defaultId = state.filters.groupId || state.groups[0]?.id || "";
  if (defaultId) {
    ui.groupEditSelect.value = defaultId;
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

  if (state.isOffline) {
    state.groups = state.groups.filter((entry) => entry.id !== groupId);
    saveOfflineGroups(state.groups);
    clearGroupColor(groupId, { silent: true });
    pruneStaleGroupColors();
    syncBookmarkGroupNames();
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
  clearGroupColor(groupId, { silent: true });
  pruneStaleGroupColors();
    syncBookmarkGroupNames();
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
  notifyDataChange("groups:changed");
}

function populateGroupEditor(targetId = null) {
  if (!ui.groupEditSelect) return;
  if (!state.groups.length) {
    ui.groupEditSelect.innerHTML = `<option value="">No groups yet</option>`;
    ui.groupEditSelect.setAttribute("disabled", "disabled");
    return;
  }
  ui.groupEditSelect.removeAttribute("disabled");
  ui.groupEditSelect.innerHTML = state.groups
    .map(
      (group) =>
        `<option value="${group.id}">${escapeHtml(group.name)}</option>`
    )
    .join("");
  const selected =
    targetId ||
    state.pendingGroupEditId ||
    state.filters.groupId ||
    state.groups[0]?.id ||
    "";
  if (selected) {
    ui.groupEditSelect.value = selected;
    hydrateGroupEditorFields(selected);
  }
}

function hydrateGroupEditorFields(groupId) {
  const group = state.groups.find((entry) => entry.id === groupId);
  if (!group) return;
  state.pendingGroupEditId = groupId;
  if (ui.groupEditNameInput) {
    ui.groupEditNameInput.value = group.name || "";
  }
  if (ui.groupEditColorInput) {
    const color =
      state.groupColors[groupId] || getGroupColor(groupId, group.name || "");
    ui.groupEditColorInput.value = color || randomGroupColor();
  }
}

async function handleGroupEditSubmit(event) {
  event.preventDefault();
  if (!state.session || !ui.groupEditSelect || state.isGroupEditSaving) return;
  const groupId = ui.groupEditSelect.value;
  if (!groupId) return;
  const group = state.groups.find((entry) => entry.id === groupId);
  if (!group) return;
  const nextName = ui.groupEditNameInput?.value.trim() || group.name;
  const nextColor = sanitizeColorValue(ui.groupEditColorInput?.value);
  const updates = {};
  if (nextName && nextName !== group.name) {
    updates.name = nextName;
  }
  const hasNameChange = Object.keys(updates).length > 0;
  if (!hasNameChange && !nextColor) {
    showCopyToast("No changes to update");
    return;
  }
  const submitButton = ui.groupEditForm?.querySelector("[type='submit']");
  state.isGroupEditSaving = true;
  submitButton?.setAttribute("disabled", "disabled");
  let colorChanged = false;
  try {
    if (state.isOffline) {
      if (hasNameChange) {
        group.name = updates.name;
        state.groups.sort((a, b) => a.name.localeCompare(b.name));
        saveOfflineGroups(state.groups);
      }
      if (nextColor) {
        colorChanged = Boolean(setGroupColor(groupId, nextColor));
      }
      state.pendingGroupEditId = null;
      if (state.filters.groupId === groupId && ui.activeGroupLabel) {
        ui.activeGroupLabel.textContent = nextName || group.name || "All bookmarks";
      }
      syncBookmarkGroupNames();
      renderGroups();
      renderBookmarks();
      showCopyToast("Group updated");
      closeModal("editGroupModal");
      return;
    }

    if (hasNameChange) {
      const { error } = await supabase
        .from("groups")
        .update(updates)
        .eq("id", groupId)
        .eq("user_id", state.session.user.id);
      if (error) {
        throw error;
      }
    }
    if (nextColor) {
      colorChanged = Boolean(setGroupColor(groupId, nextColor));
    }
    state.pendingGroupEditId = null;
    if (state.filters.groupId === groupId && ui.activeGroupLabel) {
      ui.activeGroupLabel.textContent = nextName || group.name || "All bookmarks";
    }
    if (hasNameChange) {
      await fetchGroups();
    } else if (!colorChanged) {
      renderGroups();
      renderBookmarks();
    }
    syncBookmarkGroupNames();
    if (hasNameChange || colorChanged) {
      notifyDataChange("groups:changed");
    }
    showCopyToast("Group updated");
    closeModal("editGroupModal");
  } catch (error) {
    console.error("Failed to update group", error);
    showCopyToast("Unable to update group");
  } finally {
    state.isGroupEditSaving = false;
    submitButton?.removeAttribute("disabled");
  }
}

function handleRandomizeGroupColorClick(event) {
  event.preventDefault();
  if (!ui.groupEditColorInput) return;
  ui.groupEditColorInput.value = randomGroupColor();
}

function resetGroupEditForm() {
  state.pendingGroupEditId = null;
  ui.groupEditForm?.reset();
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

async function createGroup(name, color) {
  if (!state.session) return;

  if (state.isOffline) {
    const newGroup = {
      id: generateOfflineId(),
      name,
      created_at: new Date().toISOString(),
      user_id: "offline-user",
    };
    state.groups.push(newGroup);
    state.groups.sort((a, b) => a.name.localeCompare(b.name));
    saveOfflineGroups(state.groups);
    if (color) {
      setGroupColor(newGroup.id, color, { silent: true });
      broadcastGroupColorsChange();
    }
    syncBookmarkGroupNames();
    renderGroups();
    renderBookmarks();
    toggleGroupDeleteMode(false);
    return;
  }

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
  if (color) {
    setGroupColor(data.id, color, { silent: true });
    broadcastGroupColorsChange();
  }
  syncBookmarkGroupNames();
  renderGroups();
  renderBookmarks();
  toggleGroupDeleteMode(false);
  notifyDataChange("groups:changed");
}

async function fetchBookmarks() {
  if (!state.session) return;
  state.isLoadingBookmarks = true;
  state.bookmarkLoadError = null;
  renderBookmarks();

  if (state.isOffline) {
    state.isLoadingBookmarks = false;
    const offlineData = getOfflineBookmarks();
    state.bookmarks = offlineData.map(normalizeBookmark);
    renderBookmarks();
    renderGroups();
    return;
  }

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
  renderGroups();
}

function normalizeBookmark(raw) {
  const group = state.groups.find((group) => group.id === raw.group_id);
  return {
    ...raw,
    groupName: group?.name || null,
    groupColor: getGroupColor(raw.group_id, group?.name || ""),
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
  enableBookmarkSwipe();
  hydrateBookmarkIcons();
}

function renderBookmarkRow(bookmark, visibleIndex) {
  const iconMarkup = createIconMarkup(bookmark);
  const isImage = bookmark.type === "image";
  const imageUrl = isImage
    ? bookmark.metadata?.image_url || bookmark.content || ""
    : null;
  const url =
    isImage || bookmark.type === "link"
      ? imageUrl || bookmark.url || bookmark.content || ""
      : "";
  const linkHref = url || "#";
  const domain = !isImage && url ? safeHostname(url) : "";
  const domainChip = domain
    ? `<span class="bookmark-domain">${domain}</span>`
    : "";
  const groupChip = bookmark.groupName
    ? `<span class="bookmark-group-tag" style="--tag-color:${
        bookmark.groupColor || "#a1a1aa"
      }">${escapeHtml(bookmark.groupName)}</span>`
    : "";
  const imageChip = isImage
    ? `<span class="bookmark-domain">Image</span>`
    : "";
  const metaPieces = [domainChip, groupChip, imageChip].filter(Boolean);
  const metaInline = metaPieces.length
    ? `<span class="bookmark-meta-inline">${metaPieces.join("")}</span>`
    : "";
  const titleMarkup =
    bookmark.type === "link" || isImage
      ? `<a class="bookmark-title" href="${linkHref}" target="_blank" rel="noreferrer">${escapeHtml(
          bookmark.title ||
            (isImage ? "Image bookmark" : domain || "Untitled link")
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
        <div class="swipe-backdrop" aria-hidden="true">
          <div class="swipe-pill edit">Edit</div>
          <div class="swipe-pill delete">Delete</div>
        </div>
        <div class="bookmark-card">
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

function enableBookmarkSwipe() {
  if (!supportsSwipeInteractions) return;
  if (!ui.bookmarkList) return;
  const rows = ui.bookmarkList.querySelectorAll(".bookmark-row");
  rows.forEach((row) => attachSwipeHandlers(row));
}

function hydrateBookmarkIcons() {
  if (!ui.bookmarkList) return;
  const iconImages = ui.bookmarkList.querySelectorAll(
    ".bookmark-icon[data-icon-type='link'] img[data-favicon]"
  );
  iconImages.forEach((img) => {
    if (img.dataset.iconHydrated === "true") return;
    img.dataset.iconHydrated = "true";
    const parent = img.closest(".bookmark-icon--link");
    if (!parent) return;

    const markFallback = () => {
      parent.classList.remove("has-favicon");
      parent.classList.add("show-fallback");
      if (img.isConnected) {
        img.remove();
      }
    };

    const markSuccess = () => {
      parent.classList.add("has-favicon");
      parent.classList.remove("show-fallback");
    };

    if (img.complete) {
      if (img.naturalWidth > 0) {
        markSuccess();
      } else {
        markFallback();
      }
      return;
    }

    img.addEventListener("load", markSuccess, { once: true });
    img.addEventListener("error", markFallback, { once: true });
  });
}

function attachSwipeHandlers(row) {
  if (row.dataset.swipeBound === "true") return;
  const card = row.querySelector(".bookmark-card");
  if (!card) return;
  row.dataset.swipeBound = "true";
  const maxOffset = 110;
  const triggerThreshold = 80;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let currentOffset = 0;
  let isActiveSwipe = false;

  const resetGesture = (options = {}) => {
    const { canceled = false } = options;
    if (!canceled) {
      finalizeSwipe(row, currentOffset, {
        threshold: triggerThreshold,
        hadSwipe: isActiveSwipe,
      });
    }
    pointerId = null;
    startX = 0;
    startY = 0;
    currentOffset = 0;
    isActiveSwipe = false;
    row.classList.remove("is-swiping");
    applySwipeOffset(row, 0);
  };

  const startGesture = (x, y, id = null) => {
    pointerId = id;
    startX = x;
    startY = y;
    currentOffset = 0;
    isActiveSwipe = false;
    row.classList.add("is-swiping");
  };

  const moveGesture = (x, y) => {
    const deltaX = x - startX;
    const deltaY = y - startY;
    if (!isActiveSwipe) {
      if (Math.abs(deltaX) < 8 || Math.abs(deltaX) < Math.abs(deltaY)) {
        return;
      }
      isActiveSwipe = true;
    }
    currentOffset = clamp(deltaX, -maxOffset, maxOffset);
    applySwipeOffset(row, currentOffset);
  };

  if (canUsePointerEvents) {
    row.addEventListener(
      "pointerdown",
      (event) => {
        if (!shouldHandleSwipePointer(event)) return;
        row.setPointerCapture?.(event.pointerId);
        startGesture(event.clientX, event.clientY, event.pointerId);
      },
      { passive: true }
    );

    row.addEventListener(
      "pointermove",
      (event) => {
        if (pointerId !== event.pointerId || pointerId == null) return;
        moveGesture(event.clientX, event.clientY);
        if (isActiveSwipe) {
          event.preventDefault();
        }
      },
      { passive: false }
    );

    row.addEventListener(
      "pointerup",
      (event) => {
        if (pointerId !== event.pointerId || pointerId == null) return;
        resetGesture();
        row.releasePointerCapture?.(event.pointerId);
      },
      { passive: true }
    );

    row.addEventListener(
      "pointercancel",
      (event) => {
        if (pointerId !== event.pointerId || pointerId == null) return;
        resetGesture({ canceled: true });
      },
      { passive: true }
    );
  } else {
    row.addEventListener(
      "touchstart",
      (event) => {
        if (event.touches.length !== 1) return;
        const touch = event.touches[0];
        startGesture(touch.clientX, touch.clientY, touch.identifier);
      },
      { passive: true }
    );

    row.addEventListener(
      "touchmove",
      (event) => {
        if (pointerId == null) return;
        const touch = [...event.touches].find(
          (entry) => entry.identifier === pointerId
        );
        if (!touch) return;
        moveGesture(touch.clientX, touch.clientY);
        if (isActiveSwipe) {
          event.preventDefault();
        }
      },
      { passive: false }
    );

    const handleTouchEnd = (event, canceled = false) => {
      if (pointerId == null) return;
      const ended = [...event.changedTouches].some(
        (entry) => entry.identifier === pointerId
      );
      if (!ended) return;
      resetGesture({ canceled });
    };

    row.addEventListener(
      "touchend",
      (event) => handleTouchEnd(event, false),
      { passive: true }
    );
    row.addEventListener(
      "touchcancel",
      (event) => handleTouchEnd(event, true),
      { passive: true }
    );
  }
}

function applySwipeOffset(row, offset) {
  row.style.setProperty("--swipe-offset", `${offset}px`);
  const intensity = Math.min(1, Math.abs(offset) / 100);
  row.style.setProperty("--swipe-intensity", intensity.toFixed(2));
  if (offset > 2) {
    row.dataset.swipeDirection = "right";
  } else if (offset < -2) {
    row.dataset.swipeDirection = "left";
  } else {
    row.dataset.swipeDirection = "";
  }
  if (intensity > 0.05) {
    row.classList.add("swipe-active");
  } else {
    row.classList.remove("swipe-active");
  }
}

function finalizeSwipe(row, offset, options = {}) {
  const { threshold = 80, hadSwipe = false } = options;
  if (!hadSwipe) return null;
  let action = null;
  if (offset <= -threshold) {
    action = "delete";
  } else if (offset >= threshold) {
    action = "edit";
  }
  if (action) {
    row.dataset.swipeCancelClick = "true";
    setTimeout(() => {
      delete row.dataset.swipeCancelClick;
    }, 220);
    triggerSwipeAction(row, action);
  }
  row.classList.remove("swipe-active");
  row.dataset.swipeDirection = "";
  row.style.setProperty("--swipe-intensity", "0");
  return action;
}

function triggerSwipeAction(row, action) {
  const bookmarkId = row.dataset.bookmarkId;
  if (!bookmarkId) return;
  const bookmark = state.bookmarks.find((entry) => entry.id === bookmarkId);
  if (!bookmark) return;
  if (action === "edit") {
    startEditingBookmark(bookmark);
  } else if (action === "delete") {
    promptDeleteBookmark(bookmark);
  }
}

function shouldHandleSwipePointer(event) {
  if (!supportsSwipeInteractions) return false;
  if (!canUsePointerEvents) return true;
  return event.pointerType === "touch" || event.pointerType === "pen";
}

function showLandingView() {
  document.body.dataset.view = "landing";
  ui.loadingView?.setAttribute("hidden", "true");
  ui.landingView?.removeAttribute("hidden");
  ui.appView?.setAttribute("hidden", "true");
  state.focusedBookmarkIndex = -1;
  updateBookmarkFocusVisuals();
}

function showAppView() {
  document.body.dataset.view = "app";
  ui.loadingView?.setAttribute("hidden", "true");
  ui.appView?.removeAttribute("hidden");
  ui.landingView?.setAttribute("hidden", "true");
}

function showLoadingView() {
  document.body.dataset.view = "loading";
  ui.loadingView?.removeAttribute("hidden");
  ui.landingView?.setAttribute("hidden", "true");
  ui.appView?.setAttribute("hidden", "true");
}

function enterBookmarkCreateMode() {
  state.editingBookmarkId = null;
  state.editingBookmarkType = null;
  state.editingImageReference = null;
  ui.saveBookmarkButton && (ui.saveBookmarkButton.textContent = "Save Bookmark");
  ui.deleteBookmarkButton?.classList.add("is-hidden");
  ui.bookmarkTitle?.setCustomValidity("");
}

function resetBookmarkForm(options = {}) {
  const { focusContent = false } = options;
  ui.bookmarkForm?.reset();
  setBookmarkFormGroup(null);
  state.editingBookmarkType = null;
  state.editingImageReference = null;
  clearPendingImageAttachment();
  enterBookmarkCreateMode();
  updatePreview();
  if (focusContent) {
    ui.bookmarkContent?.focus();
  }
}

function startEditingBookmark(bookmark) {
  state.editingBookmarkId = bookmark.id;
  state.editingBookmarkType = bookmark.type || null;
  clearPendingImageAttachment();
  if (bookmark.type === "image") {
    hydrateImagePreviewFromBookmark(bookmark);
  }
  if (ui.bookmarkContent) {
    if (bookmark.type === "image") {
      ui.bookmarkContent.value = bookmark.text_note || "";
    } else {
      ui.bookmarkContent.value = bookmark.content;
    }
  }
  if (ui.bookmarkTitle) ui.bookmarkTitle.value = bookmark.title || "";
  setBookmarkFormGroup(bookmark.group_id || null);
  ui.saveBookmarkButton && (ui.saveBookmarkButton.textContent = "Update Bookmark");
  ui.deleteBookmarkButton?.classList.remove("is-hidden");
  updatePreview();
  openModal("bookmarkModal");
  ui.bookmarkContent?.focus();
}

async function deleteBookmarkById(bookmarkId) {
  if (!bookmarkId) return;

  if (state.isOffline) {
    state.bookmarks = state.bookmarks.filter(
      (bookmark) => bookmark.id !== bookmarkId
    );
    const offlineBookmarks = getOfflineBookmarks().filter(
      (bookmark) => bookmark.id !== bookmarkId
    );
    saveOfflineBookmarks(offlineBookmarks);
    if (state.editingBookmarkId === bookmarkId) {
      state.editingBookmarkId = null;
    }
    state.focusedBookmarkIndex = -1;
    renderBookmarks();
    renderGroups();
    resetBookmarkForm();
    return;
  }

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
  resetBookmarkForm();
  notifyDataChange("bookmarks:changed");
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

async function handlePasteBookmarkContent() {
  if (!navigator.clipboard?.readText) {
    showCopyToast("Clipboard access is blocked");
    return;
  }
  try {
    const pasted = await navigator.clipboard.readText();
    if (!pasted) {
      showCopyToast("Clipboard is empty");
      return;
    }
    if (ui.bookmarkContent) {
      ui.bookmarkContent.value = pasted;
    }
    updatePreview();
    ui.bookmarkContent?.focus();
    showCopyToast("Pasted from clipboard");
  } catch (error) {
    console.warn("Unable to paste from clipboard", error);
    showCopyToast("Clipboard unavailable");
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

function openBookmarkLink(bookmark) {
  if (bookmark.type !== "link") return;
  const targetUrl = bookmark.url || bookmark.content;
  if (!targetUrl) return;
  window.open(targetUrl, "_blank", "noopener");
}

function createIconMarkup(bookmark) {
  if (bookmark.type === "color") {
    return `<div class="bookmark-icon" style="background:${bookmark.color_code};"></div>`;
  }
  if (bookmark.type === "link") {
    const url = bookmark.url || bookmark.content || "";
    const domain = url ? safeHostname(url) : "";
    const favicon = domain ? resolveFaviconUrl(domain) : null;
    const fallbackLabel = domainGlyph(domain);
    const classes = ["bookmark-icon", "bookmark-icon--link"];
    if (!favicon) {
      classes.push("show-fallback");
    }
    return `
      <div class="${classes.join(" ")}" data-icon-type="link">
        ${
          favicon
            ? `<img src="${favicon}" alt="${escapeHtml(
                domain || "Link"
              )} favicon" loading="lazy" decoding="async" data-favicon="true" />`
            : ""
        }
        <span class="bookmark-icon-fallback" aria-hidden="true">${escapeHtml(
          fallbackLabel
        )}</span>
      </div>
    `;
  }
  if (bookmark.type === "image") {
    const imageUrl = bookmark.metadata?.image_url || bookmark.content || "";
    const averageColor =
      bookmark.metadata?.image_avg_color || "rgba(255,255,255,0.08)";
    const title = bookmark.title || "Image bookmark";
    return `
      <div class="bookmark-icon bookmark-icon--image" style="background:${averageColor};">
        ${
          imageUrl
            ? `<img src="${imageUrl}" alt="${escapeHtml(
                title
              )}" loading="lazy" decoding="async" />`
            : `<span class="bookmark-icon-fallback" aria-hidden="true">IMG</span>`
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

  const rawContent = ui.bookmarkContent.value.trim();
  const hasPendingImage = Boolean(state.pendingImageAttachment);
  const hasExistingImage =
    Boolean(state.editingImageReference) && !state.pendingImageAttachment;
  const shouldTreatAsImage = hasPendingImage || hasExistingImage;

  if (!rawContent && !shouldTreatAsImage) return;

  const detected = shouldTreatAsImage ? { type: "image" } : detectContent(rawContent);
  let title = ui.bookmarkTitle.value.trim();
  let bookmarkMutationOccurred = false;

  if (!title) {
    title =
      detected.type === "image"
        ? deriveImageTitle()
        : await resolveTitle(detected);
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
  closeModal("bookmarkModal", { skipReset: true });
  const editingId = state.editingBookmarkId;
  let saveSucceeded = false;

  try {
    let imageMetadata = null;
    const noteForImage = detected.type === "image" ? rawContent || null : null;
    if (detected.type === "image") {
      if (state.isOffline && hasPendingImage) {
        showCopyToast("Image uploads are not available in offline mode.");
        return;
      }
      try {
        let uploadResult = null;
        if (hasPendingImage) {
          uploadResult = await uploadBookmarkImage(state.pendingImageAttachment);
        } else if (hasExistingImage) {
          uploadResult = {
            publicUrl: state.editingImageReference?.url || null,
            path: state.editingImageReference?.path || null,
          };
        }
        if (!uploadResult?.publicUrl) {
          showCopyToast("Image upload failed. Check Storage settings.");
          return;
        }
        imageMetadata = {
          image_url: uploadResult.publicUrl,
          image_path: uploadResult.path || null,
          image_avg_color:
            state.pendingImageAverageColor ||
            state.editingImageReference?.averageColor ||
            null,
          image_width:
            state.pendingImageDimensions?.width ||
            state.editingImageReference?.width ||
            null,
          image_height:
            state.pendingImageDimensions?.height ||
            state.editingImageReference?.height ||
            null,
        };
      } catch (error) {
        console.error("Failed to upload image", error);
        showCopyToast("Image upload failed. Check Storage settings.");
        return;
      }
    }

    const metadata = {};
    if (detected.type === "link") {
      metadata.domain = detected.hostname || null;
    }
    if (detected.type === "text") {
      metadata.gradient = gradientFromString(rawContent);
    }
    if (imageMetadata) {
      Object.assign(metadata, imageMetadata);
    }

    const basePayload = {
      content:
        detected.type === "image" ? imageMetadata?.image_url || "" : rawContent,
      title,
      type: detected.type,
      url: detected.type === "link" ? detected.url : null,
      color_code: detected.type === "color" ? detected.color : null,
      text_note:
        detected.type === "text"
          ? rawContent
          : detected.type === "image"
          ? noteForImage
          : null,
      group_id: ui.groupSelect.value || null,
      metadata,
    };

    let record;
    if (state.isOffline) {
      if (editingId) {
        record = {
          id: editingId,
          ...basePayload,
          created_at:
            state.bookmarks.find((b) => b.id === editingId)?.created_at ||
            new Date().toISOString(),
          user_id: "offline-user",
        };
        state.bookmarks = state.bookmarks.map((bookmark) =>
          bookmark.id === record.id ? normalizeBookmark(record) : bookmark
        );
        const offlineBookmarks = getOfflineBookmarks().map((bookmark) =>
          bookmark.id === record.id ? record : bookmark
        );
        saveOfflineBookmarks(offlineBookmarks);
        bookmarkMutationOccurred = true;
      } else {
        record = {
          id: generateOfflineId(),
          ...basePayload,
          created_at: new Date().toISOString(),
          user_id: "offline-user",
        };
        state.bookmarks = [normalizeBookmark(record), ...state.bookmarks];
        const offlineBookmarks = getOfflineBookmarks();
        offlineBookmarks.unshift(record);
        saveOfflineBookmarks(offlineBookmarks);
        bookmarkMutationOccurred = true;
      }
    } else if (editingId) {
      const updatePayload = { ...basePayload };
      const { data, error } = await supabase
        .from("bookmarks")
        .update(updatePayload)
        .eq("id", editingId)
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
      bookmarkMutationOccurred = true;
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
      bookmarkMutationOccurred = true;
    }

    renderBookmarks();
    renderGroups();
    resetBookmarkForm();
    saveSucceeded = true;
    if (bookmarkMutationOccurred) {
      notifyDataChange("bookmarks:changed");
    }
  } finally {
    state.isSavingBookmark = false;
    ui.saveBookmarkButton?.removeAttribute("disabled");
    if (!saveSucceeded && !state.editingBookmarkId) {
      enterBookmarkCreateMode();
    }
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

function deriveImageTitle() {
  if (state.pendingImageAttachment?.name) {
    const base = state.pendingImageAttachment.name.replace(/\.[^/.]+$/, "");
    return base || "Image bookmark";
  }
  if (state.editingImageReference?.url) {
    try {
      const url = new URL(state.editingImageReference.url);
      const candidate = url.pathname.split("/").filter(Boolean).pop() || "";
      const cleaned = candidate.replace(/\.[^/.]+$/, "");
      return cleaned || "Image bookmark";
    } catch (_error) {
      return "Image bookmark";
    }
  }
  return "Image bookmark";
}

async function prepareImageAttachment(file) {
  if (!file || !file.type?.startsWith("image/")) {
    showCopyToast("Only image files are supported");
    return;
  }
  try {
    const analysis = await analyzeImageFile(file);
    state.pendingImageAttachment = file;
    state.pendingImagePreviewUrl = analysis.dataUrl;
    state.pendingImageAverageColor = analysis.averageColor;
    state.pendingImageDimensions = {
      width: analysis.width,
      height: analysis.height,
    };
    state.editingImageReference = null;
    renderAttachmentPreview({
      url: analysis.dataUrl,
      averageColor: analysis.averageColor,
      name: file.name,
      width: analysis.width,
      height: analysis.height,
    });
    updatePreview();
    if (ui.bookmarkModal?.getAttribute("aria-hidden") === "true") {
      openModal("bookmarkModal");
    }
  } catch (error) {
    console.error("Unable to process image", error);
    showCopyToast("Unable to process image");
  }
}

function hydrateImagePreviewFromBookmark(bookmark) {
  const imageUrl =
    bookmark.metadata?.image_url || bookmark.content || "";
  state.editingImageReference = {
    url: imageUrl,
    path: bookmark.metadata?.image_path || null,
    averageColor: bookmark.metadata?.image_avg_color || null,
    width: bookmark.metadata?.image_width || null,
    height: bookmark.metadata?.image_height || null,
  };
  state.pendingImageAttachment = null;
  state.pendingImagePreviewUrl = imageUrl;
  state.pendingImageAverageColor = state.editingImageReference.averageColor;
  state.pendingImageDimensions = {
    width: state.editingImageReference.width,
    height: state.editingImageReference.height,
  };
  renderAttachmentPreview({
    url: imageUrl,
    averageColor: state.editingImageReference.averageColor,
    name: bookmark.title || "Image bookmark",
    width: state.editingImageReference.width,
    height: state.editingImageReference.height,
  });
  updatePreview();
}

function renderAttachmentPreview(details = {}) {
  if (!ui.bookmarkAttachmentZone) return;
  ui.bookmarkAttachmentZone.dataset.hasFile = "true";
  ui.bookmarkAttachmentZone.classList.remove("is-dragging");
  ui.bookmarkAttachmentPreview?.removeAttribute("hidden");
  if (ui.bookmarkAttachmentPreviewImage && details.url) {
    ui.bookmarkAttachmentPreviewImage.src = details.url;
  }
  if (ui.bookmarkAttachmentFileName) {
    ui.bookmarkAttachmentFileName.textContent =
      details.name || "Image attachment";
  }
  if (ui.bookmarkAttachmentColor) {
    const sizeLabel =
      details.width && details.height
        ? `${Math.round(details.width)}×${Math.round(details.height)}px`
        : "";
    const colorLabel = details.averageColor
      ? `Avg ${details.averageColor}`
      : "";
    ui.bookmarkAttachmentColor.textContent = [sizeLabel, colorLabel]
      .filter(Boolean)
      .join(" • ");
  }
}

function clearPendingImageAttachment() {
  state.pendingImageAttachment = null;
  state.pendingImagePreviewUrl = null;
  state.pendingImageAverageColor = null;
  state.pendingImageDimensions = null;
  state.editingImageReference = null;
  ui.bookmarkAttachmentZone?.classList.remove("is-dragging");
  if (ui.bookmarkAttachmentZone) {
    ui.bookmarkAttachmentZone.dataset.hasFile = "false";
  }
  if (ui.bookmarkAttachmentPreview) {
    ui.bookmarkAttachmentPreview.setAttribute("hidden", "hidden");
  }
  if (ui.bookmarkAttachmentPreviewImage) {
    ui.bookmarkAttachmentPreviewImage.src = "";
  }
  if (ui.bookmarkAttachmentFileName) {
    ui.bookmarkAttachmentFileName.textContent = "";
  }
  if (ui.bookmarkAttachmentColor) {
    ui.bookmarkAttachmentColor.textContent = "";
  }
  if (ui.bookmarkAttachmentInput) {
    ui.bookmarkAttachmentInput.value = "";
  }
}

async function analyzeImageFile(file) {
  const dataUrl = await readFileAsDataUrl(file);
  const analysis = await extractAverageColorFromDataUrl(dataUrl);
  return {
    dataUrl,
    averageColor: analysis.averageColor,
    width: analysis.width,
    height: analysis.height,
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function extractAverageColorFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const sampleSize = 10;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        context.drawImage(img, 0, 0, sampleSize, sampleSize);
        const { data } = context.getImageData(0, 0, sampleSize, sampleSize);
        let r = 0;
        let g = 0;
        let b = 0;
        for (let index = 0; index < data.length; index += 4) {
          r += data[index];
          g += data[index + 1];
          b += data[index + 2];
        }
        const totalPixels = data.length / 4;
        const averageColor = `#${toHex(r / totalPixels)}${toHex(
          g / totalPixels
        )}${toHex(b / totalPixels)}`;
        resolve({
          averageColor,
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0,
        });
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function uploadBookmarkImage(file) {
  if (!state.session) {
    throw new Error("Missing session");
  }
  const fileExt =
    (file.name?.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "png";
  const fileName = `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}.${fileExt}`;
  const storagePath = `${state.session.user.id}/${fileName}`;
  const { error } = await supabase.storage
    .from(BOOKMARK_IMAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || "image/png",
      cacheControl: "3600",
      upsert: false,
    });
  if (error) {
    throw error;
  }
  const { data } = supabase.storage
    .from(BOOKMARK_IMAGE_BUCKET)
    .getPublicUrl(storagePath);
  if (!data?.publicUrl) {
    throw new Error("Unable to resolve public URL for uploaded image");
  }
  return {
    publicUrl: data.publicUrl,
    path: storagePath,
  };
}

function openBookmarkModalWithContent(value) {
  if (!state.session || !value) return;
  resetBookmarkForm({ focusContent: false });
  if (ui.bookmarkContent) {
    ui.bookmarkContent.value = value.trim();
  }
  updatePreview();
  openModal("bookmarkModal");
  ui.bookmarkContent?.focus();
}

function hasSupportedDropData(event) {
  const types = Array.from(event.dataTransfer?.types || []);
  return (
    types.includes("Files") ||
    types.includes("text/plain") ||
    types.includes("text/uri-list")
  );
}

function handleGlobalDragEnter(event) {
  if (!state.session || !hasSupportedDropData(event)) return;
  globalDragDepth += 1;
  document.body.dataset.dropActive = "true";
}

function handleGlobalDragLeave(event) {
  if (globalDragDepth === 0) return;
  globalDragDepth = Math.max(0, globalDragDepth - 1);
  if (globalDragDepth === 0) {
    delete document.body.dataset.dropActive;
  }
}

function handleGlobalDragOver(event) {
  if (!state.session || !hasSupportedDropData(event)) return;
  event.preventDefault();
}

function handleGlobalDrop(event) {
  if (!state.session || !event.dataTransfer) return;
  if (!hasSupportedDropData(event)) return;
  const droppingIntoField = Boolean(
    event.target?.closest(
      "input, textarea, select, [contenteditable='true'], .attachment-zone"
    )
  );
  globalDragDepth = 0;
  delete document.body.dataset.dropActive;
  if (droppingIntoField) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const files = [...(event.dataTransfer.files || [])];
  const imageFile = files.find((entry) => entry.type.startsWith("image/"));
  if (imageFile) {
    prepareImageAttachment(imageFile);
    return;
  }
  const textData =
    event.dataTransfer.getData("text/plain") ||
    event.dataTransfer.getData("text/uri-list");
  if (textData) {
    openBookmarkModalWithContent(textData);
  }
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

function extractUrlFromText(text = "") {
  if (!text) return "";
  const match = text.match(/(https?:\/\/|www\.)[^\s)]+/i);
  if (!match) return "";
  let candidate = match[0].replace(/[)\],.;!?]+$/, "");
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  return candidate;
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
    const normalized = normalizeExternalUrl(url);
    if (!normalized) return null;
    const proxiedUrl = buildTitleProxyUrl(normalized);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(proxiedUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const text = await response.text();
    const doc = new DOMParser().parseFromString(text, "text/html");
    const candidates = [
      doc
        .querySelector("meta[property='og:title']")
        ?.getAttribute("content"),
      doc.querySelector("meta[name='og:title']")?.getAttribute("content"),
      doc
        .querySelector("meta[property='twitter:title']")
        ?.getAttribute("content"),
      doc.querySelector("title")?.textContent,
    ]
      .map((value) => value?.trim())
      .filter(Boolean);
    return candidates[0] || null;
  } catch (error) {
    if (error.name !== "AbortError") {
      console.warn("Unable to fetch page title", error);
    }
  }
  return null;
}

function updatePreview() {
  if (!ui.previewCard) return;
  const content = ui.bookmarkContent.value.trim();
  const hasImageAttachment =
    Boolean(state.pendingImageAttachment) ||
    Boolean(state.editingImageReference);
  const detected = hasImageAttachment ? { type: "image" } : detectContent(content);
  const manualTitle = ui.bookmarkTitle.value.trim();
  const title = manualTitle || autoPreviewTitle(detected);
  const titleNode = ui.previewCard.querySelector(".preview-title");
  const metaNode = ui.previewCard.querySelector(".preview-meta");
  const icon = ui.previewCard.querySelector(".preview-icon");
  if (!titleNode || !metaNode || !icon) return;
  if (ui.bookmarkModal) {
    ui.bookmarkModal.dataset.previewType = detected.type;
  }
  titleNode.textContent = title;
  if (detected.type === "image") {
    const previewSrc =
      state.pendingImagePreviewUrl || state.editingImageReference?.url || "";
    const color =
      state.pendingImageAverageColor ||
      state.editingImageReference?.averageColor ||
      "rgba(255,255,255,0.08)";
    const label =
      state.pendingImageAttachment?.name ||
      state.editingImageReference?.url?.split("/").pop() ||
      "Image attachment";
    metaNode.textContent = label;
    icon.style.background = color;
    icon.innerHTML = previewSrc ? `<img src="${previewSrc}" alt="">` : "🖼️";
    return;
  }
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
  if (detected.type === "image") {
    return deriveImageTitle();
  }
  return "Add a title";
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  toggleBookmarkGroupMenu(false);
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(id, options = {}) {
  const { skipReset = false } = options;
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
  if (id === "bookmarkModal") {
    if (!skipReset) {
      resetBookmarkForm();
    }
  } else if (id === "deleteGroupModal") {
    state.pendingGroupDeleteId = null;
    state.groupDeleteMode = false;
    renderGroups();
  } else if (id === "deleteBookmarkModal") {
    state.pendingBookmarkDeleteId = null;
  } else if (id === "editGroupModal") {
    resetGroupEditForm();
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

function domainGlyph(domain = "") {
  const cleaned = domain.replace(/[^a-z0-9]/gi, "");
  if (!cleaned) return "??";
  return cleaned.slice(0, 2).toUpperCase();
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

function normalizeExternalUrl(url = "") {
  if (!url) return "";
  return /^(https?:\/\/)/i.test(url) ? url : `https://${url}`;
}

function buildTitleProxyUrl(targetUrl) {
  const encodedTarget = encodeURIComponent(targetUrl)
    .replace(/%3A/gi, ":")
    .replace(/%2F/gi, "/");
  return `https://r.jina.ai/${encodedTarget}`;
}

function prettifyHostname(hostname = "") {
  return hostname.replace(/^www\./, "");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resolveFaviconUrl(link = "") {
  const domain = safeHostname(link);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(
    domain
  )}`;
}

function subscribeToRealtime() {
  if (!state.session) return;
  clearRealtimeRetry();
  unsubscribeFromRealtime();
  const userId = state.session.user.id;

  const bookmarkChannel = createRealtimeChannel(
    `bookmarks-${userId}`,
    {
      event: "*",
      schema: "public",
      table: "bookmarks",
      filter: `user_id=eq.${userId}`,
    },
    handleBookmarkRealtimeChange
  );

  const groupChannel = createRealtimeChannel(
    `groups-${userId}`,
    {
      event: "*",
      schema: "public",
      table: "groups",
      filter: `user_id=eq.${userId}`,
    },
    handleGroupRealtimeChange
  );

  realtimeChannels.push(bookmarkChannel, groupChannel);
}

function unsubscribeFromRealtime() {
  while (realtimeChannels.length) {
    const channel = realtimeChannels.pop();
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
  clearRealtimeRetry();
}

function createRealtimeChannel(name, filter, handler) {
  const channel = supabase.channel(name).on("postgres_changes", filter, handler);
  channel.subscribe((status) => handleRealtimeStatus(status, name, channel));
  return channel;
}

function handleRealtimeStatus(status, context, channel) {
  if (status === "SUBSCRIBED") {
    return;
  }
  if (!realtimeChannels.includes(channel)) {
    return;
  }
  if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
    console.warn(`Realtime channel ${context} ${status}. Retrying soon.`);
    scheduleRealtimeRetry();
  }
}

function scheduleRealtimeRetry(delay = REALTIME_RETRY_DELAY) {
  if (realtimeRetryTimer || !state.session) return;
  realtimeRetryTimer = setTimeout(() => {
    realtimeRetryTimer = null;
    if (!state.session) return;
    subscribeToRealtime();
  }, delay);
}

function clearRealtimeRetry() {
  if (!realtimeRetryTimer) return;
  clearTimeout(realtimeRetryTimer);
  realtimeRetryTimer = null;
}

function notifyDataChange(topic, payload = {}) {
  if (!dataBroadcast) return;
  dataBroadcast.postMessage({
    type: topic,
    clientId,
    timestamp: Date.now(),
    ...payload,
  });
}

function broadcastGroupColorsChange(colors = state.groupColors) {
  notifyDataChange("groupColors:changed", { colors });
}

function refreshGroupColors(externalColors) {
  if (externalColors && typeof externalColors === "object") {
    state.groupColors = sanitizeGroupColorMap(externalColors);
  } else {
    state.groupColors = loadStoredGroupColors();
    persistGroupColors();
  }
  syncBookmarkGroupNames();
  renderGroups();
  renderBookmarks();
}

function loadStoredGroupColors() {
  if (!hasStorage) return {};
  try {
    const raw = localStorage.getItem(GROUP_COLOR_STORAGE_KEY);
    if (!raw) return {};
    return sanitizeGroupColorMap(JSON.parse(raw));
  } catch (error) {
    console.warn("Unable to load group colors", error);
    return {};
  }
}

function persistGroupColors() {
  if (!hasStorage) return;
  try {
    localStorage.setItem(
      GROUP_COLOR_STORAGE_KEY,
      JSON.stringify(state.groupColors || {})
    );
  } catch (error) {
    console.warn("Unable to persist group colors", error);
  }
}

function sanitizeGroupColorMap(raw = {}) {
  return Object.entries(raw || {}).reduce((acc, [groupId, value]) => {
    const sanitized = sanitizeColorValue(value);
    if (sanitized) {
      acc[groupId] = sanitized;
    }
    return acc;
  }, {});
}

function parseGroupColorPayload(payload) {
  if (!payload) return {};
  try {
    return sanitizeGroupColorMap(JSON.parse(payload));
  } catch (_error) {
    return {};
  }
}

function sanitizeColorValue(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.length) return null;
  let normalized = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) {
    if (normalized.length === 4) {
      normalized =
        "#" +
        normalized
          .slice(1)
          .split("")
          .map((char) => `${char}${char}`)
          .join("");
    }
    return normalized.toUpperCase();
  }
  return null;
}

function toHex(value) {
  const clamped = Math.max(0, Math.min(255, Math.round(value)));
  return clamped.toString(16).padStart(2, "0");
}

function randomGroupColor() {
  const index = Math.floor(Math.random() * GROUP_COLOR_PALETTE.length);
  return GROUP_COLOR_PALETTE[index];
}

function suggestGroupColor(seed = "") {
  return seed ? colorFromSeed(seed) : randomGroupColor();
}

function setGroupColor(groupId, color, options = {}) {
  if (!groupId) return false;
  const sanitized = sanitizeColorValue(color);
  if (!sanitized) return false;
  if (state.groupColors[groupId] === sanitized) return false;
  state.groupColors = {
    ...state.groupColors,
    [groupId]: sanitized,
  };
  persistGroupColors();
  if (!options.silent) {
    syncBookmarkGroupNames();
    renderGroups();
    renderBookmarks();
    broadcastGroupColorsChange();
  }
  return true;
}

function clearGroupColor(groupId, options = {}) {
  if (!groupId || !state.groupColors[groupId]) return false;
  const next = { ...state.groupColors };
  delete next[groupId];
  state.groupColors = next;
  persistGroupColors();
  if (!options.silent) {
    syncBookmarkGroupNames();
    renderGroups();
    renderBookmarks();
    broadcastGroupColorsChange();
  }
  return true;
}

function pruneStaleGroupColors() {
  const validIds = new Set(state.groups.map((group) => group.id));
  const next = {};
  Object.entries(state.groupColors || {}).forEach(([groupId, color]) => {
    if (validIds.has(groupId) && color) {
      next[groupId] = color;
    }
  });
  if (Object.keys(next).length === Object.keys(state.groupColors || {}).length) {
    return;
  }
  state.groupColors = next;
  persistGroupColors();
}

function getGroupColor(groupId, fallbackSeed = "") {
  if (!groupId) return null;
  if (state.groupColors[groupId]) {
    return state.groupColors[groupId];
  }
  const group = state.groups.find((entry) => entry.id === groupId);
  const seed = fallbackSeed || group?.name || groupId;
  return seed ? colorFromSeed(seed) : randomGroupColor();
}

function colorFromSeed(seed = "") {
  if (!seed) return GROUP_COLOR_PALETTE[0];
  const hash = [...seed].reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  );
  return GROUP_COLOR_PALETTE[hash % GROUP_COLOR_PALETTE.length];
}

function queueDataResync(options = {}) {
  if (!state.session) return null;
  const { force = false } = options;
  if (pendingDataResync) {
    return pendingDataResync;
  }
  const now = Date.now();
  if (!force && now - lastDataResyncAt < DATA_RESYNC_COOLDOWN) {
    return null;
  }
  pendingDataResync = Promise.all([fetchGroups(), fetchBookmarks()])
    .catch((error) => {
      console.warn("Failed to refresh data", error);
    })
    .finally(() => {
      lastDataResyncAt = Date.now();
      pendingDataResync = null;
    });
  return pendingDataResync;
}

function handleVisibilityResync() {
  if (typeof document === "undefined") return;
  if (document.visibilityState === "visible") {
    queueDataResync();
  }
}

function handleBookmarkRealtimeChange(payload) {
  if (!payload?.eventType) {
    return;
  }
  const eventType = payload.eventType;
  const recordUserId =
    payload.new?.user_id ?? payload.old?.user_id ?? null;
  if (state.session && recordUserId && recordUserId !== state.session.user.id) {
    return;
  }

  if (eventType === "DELETE") {
    const deletedId = payload.old?.id;
    if (!deletedId) return;
    state.bookmarks = state.bookmarks.filter(
      (bookmark) => bookmark.id !== deletedId
    );
    if (state.editingBookmarkId === deletedId) {
      state.editingBookmarkId = null;
    }
    renderGroups();
    renderBookmarks();
    return;
  }

  const record = payload.new;
  if (!record) return;
  const normalized = normalizeBookmark(record);
  const existingIndex = state.bookmarks.findIndex(
    (bookmark) => bookmark.id === normalized.id
  );
  if (existingIndex >= 0) {
    state.bookmarks[existingIndex] = normalized;
  } else {
    state.bookmarks = [normalized, ...state.bookmarks];
  }
  state.bookmarks.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
    renderGroups();
    renderBookmarks();
}

function handleGroupRealtimeChange(payload) {
  if (!payload?.eventType) return;
  const eventType = payload.eventType;

  if (eventType === "DELETE") {
    const deletedId = payload.old?.id;
    if (!deletedId) return;
    state.groups = state.groups.filter((group) => group.id !== deletedId);
    const removedColor = clearGroupColor(deletedId, { silent: true });
    if (removedColor) {
      broadcastGroupColorsChange();
    }
    if (state.filters.groupId === deletedId) {
      state.filters.groupId = null;
      if (ui.activeGroupLabel) {
        ui.activeGroupLabel.textContent = "All bookmarks";
      }
    }
  } else {
    const record = payload.new;
    if (!record) return;
    const existingIndex = state.groups.findIndex(
      (group) => group.id === record.id
    );
    if (existingIndex >= 0) {
      state.groups[existingIndex] = record;
    } else {
      state.groups.push(record);
    }
    state.groups.sort((a, b) => a.name.localeCompare(b.name));
  }

    pruneStaleGroupColors();
  syncBookmarkGroupNames();
  renderGroups();
  renderBookmarks();
}

function syncBookmarkGroupNames() {
  if (!state.bookmarks.length) return;
  state.bookmarks = state.bookmarks.map((bookmark) => ({
    ...bookmark,
    groupName:
      state.groups.find((group) => group.id === bookmark.group_id)?.name ||
      null,
    groupColor: getGroupColor(
      bookmark.group_id,
      state.groups.find((group) => group.id === bookmark.group_id)?.name || ""
    ),
  }));
}

function waitForInitialSession(timeout = 4000) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (session) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      resolve(session);
    };
    const timer = setTimeout(() => finish(null), timeout);

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
          finish(session);
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

function getOfflineBookmarks() {
  if (!hasStorage) return [];
  try {
    const raw = localStorage.getItem(OFFLINE_BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn("Unable to load offline bookmarks", error);
    return [];
  }
}

function saveOfflineBookmarks(bookmarks) {
  if (!hasStorage) return;
  try {
    localStorage.setItem(OFFLINE_BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch (error) {
    console.warn("Unable to save offline bookmarks", error);
  }
}

function getOfflineGroups() {
  if (!hasStorage) return [];
  try {
    const raw = localStorage.getItem(OFFLINE_GROUPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn("Unable to load offline groups", error);
    return [];
  }
}

function saveOfflineGroups(groups) {
  if (!hasStorage) return;
  try {
    localStorage.setItem(OFFLINE_GROUPS_KEY, JSON.stringify(groups));
  } catch (error) {
    console.warn("Unable to save offline groups", error);
  }
}

function generateOfflineId() {
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function exitOfflineMode() {
  if (!hasStorage) return;
  localStorage.removeItem(OFFLINE_MODE_KEY);
  window.location.replace("/login.html");
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
  setBookmarkFormGroup(null);
  if (payload.content && ui.bookmarkContent) {
    ui.bookmarkContent.value = payload.content;
  }
  if (payload.title && ui.bookmarkTitle) {
    ui.bookmarkTitle.value = payload.title;
  }
  if (payload.group) {
    const target = state.groups.find((group) => {
      if (group.id === payload.group) return true;
      if (!group.name) return false;
      return group.name.toLowerCase() === payload.group.toLowerCase();
    });
    if (target) {
      setBookmarkFormGroup(target.id);
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
  ["content", "title", "group", "new", "text", "url"].forEach((key) => {
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
  const payload = buildLaunchPayloadFromParams(params);
  return hasLaunchPayload(payload) ? payload : null;
}

function cleanParam(value) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function buildLaunchPayloadFromParams(params) {
  if (!params) return null;
  const contentParam = cleanParam(params.get("content"));
  const sharedUrl = cleanParam(params.get("url"));
  const sharedText = cleanParam(params.get("text"));
  let title = cleanParam(params.get("title"));
  const group = cleanParam(params.get("group"));

  const content =
    contentParam || sharedUrl || extractUrlFromText(sharedText) || sharedText;

  if (!title && sharedText && sharedText !== content) {
    title = sharedText.slice(0, 120);
  }

  const openModal =
    params.has("new") ||
    ["1", "true", "yes"].includes(
      (params.get("new") || "").trim().toLowerCase()
    );

  return {
    content,
    title,
    group,
    openModal: openModal || Boolean(content || title || group),
  };
}

function hasLaunchPayload(payload) {
  if (!payload) return false;
  return Boolean(
    payload.content || payload.title || payload.group || payload.openModal
  );
}
