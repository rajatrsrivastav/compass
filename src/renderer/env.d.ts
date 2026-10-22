import type { Bridge } from "../shared/types";
declare global {
  interface Window {
    compass: Bridge;
  }
}
