const KEY = "continuum:revisit:enabled";
export const isRevisitEnabled = () => { try { return localStorage.getItem(KEY) !== "0"; } catch { return true; } };
export const setRevisitEnabled = (on: boolean) => localStorage.setItem(KEY, on ? "1" : "0");
