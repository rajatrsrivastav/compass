import { create } from "zustand";
import type { Snapshot, Action } from "../shared/types";
interface State {
  data: Snapshot | null;
  page: string;
  selected: string | null;
  error: string;
  notice: string;
  busy: number;
  refresh: () => Promise<void>;
  act: (a: Action) => Promise<boolean>;
  navigate: (page: string) => void;
  select: (id: string | null) => void;
}
export const useApp = create<State>((set, get) => ({
  data: null,
  page: "Overview",
  selected: null,
  error: "",
  notice: "",
  busy: 0,
  refresh: async () => {
    try {
      set({ data: await window.compass.snapshot() });
    } catch (e) {
      set({ error: String(e) });
    }
  },
  act: async (a) => {
    set((s) => ({ busy: s.busy + 1, error: "", notice: "" }));
    try {
      const result = await window.compass.act(a);
      await get().refresh();
      if (result.message) set({ notice: result.message });
      return true;
    } catch (e) {
      set({ error: String(e).replace(/^Error:.*?Error: /, "") });
      return false;
    } finally {
      set((s) => ({ busy: s.busy - 1 }));
    }
  },
  navigate: (page) => set({ page, selected: null, error: "", notice: "" }),
  select: (selected) => set({ selected }),
}));
