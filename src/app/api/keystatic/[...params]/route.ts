import { makeRouteHandler } from "@keystatic/next/route-handler";
import config from "../../../../../keystatic.config";

/* A API do painel. No ar, sem repositório no GitHub, ela não responde (ver `app/keystatic/layout`). */
const podeAbrir = process.env.NODE_ENV !== "production" || Boolean(process.env.KEYSTATIC_GITHUB_REPO);

const fechado = () => new Response("Not found", { status: 404 });
const handler = makeRouteHandler({ config });

export const GET = podeAbrir ? handler.GET : fechado;
export const POST = podeAbrir ? handler.POST : fechado;
