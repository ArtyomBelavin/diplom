"use client";

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiFetch } from "@/lib/api";

export type AccessibilityState = {
  fontScale: number;
  contrastMode: "default" | "high";
  lineSpacing: "normal" | "wide";
  hideImages: boolean;
  reducedMotion: boolean;
  voiceHints: boolean;
  captionsDefault: boolean;
  focusHighlight: boolean;
};

type AuthState = {
  token: string | null;
  email: string | null;
  role: string | null;
};

type AccessibilityContextValue = {
  settings: AccessibilityState;
  setSettings: (patch: Partial<AccessibilityState>) => void;
  announce: (message: string) => void;
  liveMessage: string;
  auth: AuthState;
  setAuth: (next: AuthState) => void;
  sessionId: string;
};

const defaultSettings: AccessibilityState = {
  fontScale: 100,
  contrastMode: "default",
  lineSpacing: "normal",
  hideImages: false,
  reducedMotion: false,
  voiceHints: false,
  captionsDefault: true,
  focusHighlight: true,
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(
  null,
);

const SETTINGS_KEY = "accessible-shop-settings";
const AUTH_KEY = "accessible-shop-auth";
const SESSION_KEY = "accessible-shop-session";

const readStoredSettings = (): AccessibilityState => {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  const storedSettings = window.localStorage.getItem(SETTINGS_KEY);
  return storedSettings
    ? (JSON.parse(storedSettings) as AccessibilityState)
    : defaultSettings;
};

const readStoredAuth = (): AuthState => {
  if (typeof window === "undefined") {
    return {
      token: null,
      email: null,
      role: null,
    };
  }

  const storedAuth = window.localStorage.getItem(AUTH_KEY);
  return storedAuth
    ? (JSON.parse(storedAuth) as AuthState)
    : {
        token: null,
        email: null,
        role: null,
      };
};

const readSessionId = (): string => {
  if (typeof window === "undefined") {
    return "guest-demo";
  }

  return window.localStorage.getItem(SESSION_KEY) || "guest-demo";
};

export function AccessibilityProvider({ children }: PropsWithChildren) {
  const [settings, setSettingsState] =
    useState<AccessibilityState>(defaultSettings);
  const [auth, setAuthState] = useState<AuthState>({
    token: null,
    email: null,
    role: null,
  });
  const [sessionId, setSessionId] = useState("guest-demo");
  const [liveMessage, setLiveMessage] = useState("");

  useEffect(() => {
    const storedSettings = readStoredSettings();
    const storedAuth = readStoredAuth();
    const storedSessionId = readSessionId();

    queueMicrotask(() => {
      setSettingsState(storedSettings);
      setAuthState(storedAuth);
      setSessionId(storedSessionId);

      if (!window.localStorage.getItem(SESSION_KEY)) {
        window.localStorage.setItem(SESSION_KEY, storedSessionId);
      }
    });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    const root = document.documentElement;
    root.style.setProperty("--font-scale", `${settings.fontScale}%`);
    root.style.setProperty(
      "--line-gap",
      settings.lineSpacing === "wide" ? "1.9" : "1.55",
    );
    root.dataset.contrast = settings.contrastMode;
    root.dataset.lineSpacing = settings.lineSpacing;
    root.dataset.hideImages = String(settings.hideImages);
    root.dataset.focus = String(settings.focusHighlight);

    if (auth.token) {
      void apiFetch("/accessibility-settings", {
        method: "PATCH",
        token: auth.token,
        body: JSON.stringify(settings),
      }).catch(() => undefined);
    }
  }, [auth.token, settings]);

  useEffect(() => {
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  }, [auth]);

  const setSettings = (patch: Partial<AccessibilityState>) => {
    setSettingsState((current) => ({ ...current, ...patch }));
  };

  const setAuth = (next: AuthState) => {
    setAuthState(next);
  };

  const announce = (message: string) => {
    setLiveMessage(message);
    if (settings.voiceHints && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        setSettings,
        announce,
        liveMessage,
        auth,
        setAuth,
        sessionId,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used inside AccessibilityProvider");
  }
  return context;
}
