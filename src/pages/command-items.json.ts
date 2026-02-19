import type { APIRoute } from "astro";
import { getCommandPaletteItems } from "@/lib/content/queries";

export const prerender = true;

export const GET: APIRoute = async () => {
  const items = await getCommandPaletteItems();
  return new Response(JSON.stringify(items), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=600"
    }
  });
};
