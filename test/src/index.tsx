import { serve } from "bun";
import { WouterFS } from "../../src";
import index from "./index.html";

const wfs = new WouterFS({
  routeFile:"./src/routes-core.tsx",
  routePath:"./src/routes",
  metaPath:"./src/metadata.json",
  routeMapPath:"./src/route-map.json"
})

await wfs.build()
const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
