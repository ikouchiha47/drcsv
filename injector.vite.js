import { loadEnv } from "vite";

export const injectEnvIntoHtmlPlugin = () => {
  const env = loadEnv("production", ".");
  return {
    name: "inject-env-html",
    transformIndexHtml(html) {
      return html.replace("$PUBLIC_URL", env["PUBLIC_URL"]);
    },
  };
};
