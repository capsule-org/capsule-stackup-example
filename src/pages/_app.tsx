import "@/styles/globals.css";
import type { AppProps } from "next/app";

if (typeof global.self === "undefined") {
  (global as any).self = global;
}

if (typeof global.addEventListener === "undefined") {
  global.addEventListener = () => { };
  global.removeEventListener = () => { };
}

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
