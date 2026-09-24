import { makeRouteHandler } from "@keystatic/next/route-handler";
import config from "../../../../../keystatic.config";
import { PAINEL_LIGADO } from "@/lib/painel";

/* A API do painel. Fechada no ar enquanto o app do GitHub não estiver configurado (`lib/painel`):
   o handler nem é criado, porque criá-lo sem as chaves derruba o build. */
const fechado = () => new Response("Not found", { status: 404 });
const handler = PAINEL_LIGADO ? makeRouteHandler({ config }) : null;

export const GET = handler ? handler.GET : fechado;
export const POST = handler ? handler.POST : fechado;
