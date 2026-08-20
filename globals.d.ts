// globals.d.ts  (créer s'il n'existe pas)
interface Window {
  gtag: (...args: unknown[]) => void;
  dataLayer: unknown[];
}
