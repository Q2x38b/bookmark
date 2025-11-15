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

const errorEl = document.getElementById("authError");
const authButton = document.getElementById("authPrimaryButton");
const authForm = document.querySelector(".auth-form");

async function ensureNoActiveSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    window.location.replace("index.html");
  }
}

ensureNoActiveSession();

authButton?.addEventListener("click", handleGoogleAuth);
authForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  handleGoogleAuth();
});

async function handleGoogleAuth() {
  if (!authButton) return;
  authButton.disabled = true;
  errorEl.textContent = "";

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/index.html`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    errorEl.textContent = error.message;
    authButton.disabled = false;
  }
}

supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    window.location.replace("index.html");
  } else if (event === "SIGNED_OUT") {
    authButton?.removeAttribute("disabled");
  }
});
