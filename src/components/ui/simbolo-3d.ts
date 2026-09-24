import {
  CatmullRomCurve3,
  Color,
  Group,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SIMBOLO_TRACO, type Ponto } from "./simbolo-traco";

gsap.registerPlugin(ScrollTrigger);

/* a câmera enxerga o símbolo com folga: a tela é 40% mais larga e 12% mais alta que ele, para o
   giro não cortar as pontas (ver .simbolo-volume-tela no CSS) */
const FOLGA_ALTURA = 1.12;
const CAMPO = 28;
const DISTANCIA = FOLGA_ALTURA / Math.tan(((CAMPO / 2) * Math.PI) / 180);
/* o quanto as laterais do desenho se curvam para trás, em unidades do mundo (a altura do símbolo
   é 2): as mãos em concha. MEDIDO: com 0,42 o giro de 15 graus mal se via numa foto parada; com
   0,75 as laterais correm uns 40px em relação ao centro e o volume aparece */
const CONCHA = 0.75;

/**
 * Monta o símbolo em volume dentro de `el` e devolve a função que desmonta tudo.
 * Chamado só pelo SimboloEmVolume, por import dinâmico: é aqui que o `three` entra.
 */
export function montarSimbolo(el: HTMLElement, aoPronto: () => void): () => void {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch {
    return () => {};
  }

  const celular = window.matchMedia("(max-width: 1023px)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, celular ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  const tela = renderer.domElement;
  tela.className = "simbolo-volume-tela";
  el.appendChild(tela);

  /* ---- a geometria: um tubo por traço, fundidos num só desenho ---- */
  const [vx, vy, vw, vh] = SIMBOLO_TRACO.viewBox;
  const cx = vx + vw / 2;
  const cy = vy + vh / 2;
  const escala = 2 / vh;
  const meiaLargura = (vw / 2) * escala;
  const raio = (SIMBOLO_TRACO.largura / 2) * escala;

  /* A curva em concha empurra as laterais para trás. Para a vista DE FRENTE continuar sendo a logo
     exata (e a troca com o SVG ser invisível), cada ponto é afastado do centro na mesma proporção
     em que a perspectiva o aproximaria. */
  const noMundo = ([x, y]: Ponto) => {
    const X = (x - cx) * escala;
    const Y = -(y - cy) * escala;
    const u = X / meiaLargura;
    const Z = -CONCHA * u * u;
    const compensa = (DISTANCIA - Z) / DISTANCIA;
    return new Vector3(X * compensa, Y * compensa, Z);
  };

  const pedacos: TubeGeometry[] = [];
  for (const pts of SIMBOLO_TRACO.tracos) {
    if (pts.length < 2) continue;
    const curva = new CatmullRomCurve3(pts.map(noMundo), false, "centripetal");
    const passos = Math.max(4, Math.min(240, Math.round((curva.getLength() / raio) * (celular ? 0.8 : 2.4))));
    pedacos.push(new TubeGeometry(curva, passos, raio, celular ? 4 : 7, false));
  }
  const geometria = mergeGeometries(pedacos);
  pedacos.forEach((g) => g.dispose());
  if (!geometria) {
    renderer.dispose();
    tela.remove();
    return () => {};
  }

  /* Sem luz de cena: a cor do papel, que escurece até o fio de apoio só onde o tubo vira de lado.
     De frente é o mesmo papel do SVG; girando, o traço ganha corpo. */
  const material = new ShaderMaterial({
    uniforms: {
      papel: { value: new Color("#FDF5DE") },
      sombra: { value: new Color("#E9C9A8") },
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 papel;
      uniform vec3 sombra;
      varying vec3 vNormal;
      void main() {
        float frente = clamp(vNormal.z, 0.0, 1.0);
        gl_FragColor = vec4(mix(sombra, papel, 0.3 + 0.7 * frente), 1.0);
        #include <colorspace_fragment>
      }`,
  });

  const desenho = new Group();
  desenho.add(new Mesh(geometria, material));
  const cena = new Scene();
  cena.add(desenho);
  const camera = new PerspectiveCamera(CAMPO, 1, 0.1, 50);
  camera.position.set(0, 0, DISTANCIA);

  const ajustar = () => {
    const w = tela.clientWidth;
    const h = tela.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  ajustar();
  const medida = new ResizeObserver(ajustar);
  medida.observe(el);

  /* ---- o movimento: trilho, não gatilho ----
     Enquanto a pessoa rola, o giro acompanha a passagem do símbolo pela tela (de -20 a +20 graus;
     10 no celular). Quando ela para, o desenho volta devagar para a vista de frente, que é a logo.
     Um balanço mínimo mantém a linha viva mesmo parada. */
  const amplitude = ((celular ? 10 : 20) * Math.PI) / 180;
  const balanco = ((celular ? 0.6 : 1.2) * Math.PI) / 180;
  let alvo = 0;
  let angulo = 0;
  let ultimaRolagem = 0;
  /* O giro inteiro acontece enquanto o símbolo está NA TELA: no desktop, o trecho em que ele fica
     preso no meio da tela (a caixa da coluna passa pelo centro, 120px acima e abaixo); no celular,
     a travessia dele pela tela. Medido: amarrado ao rodapé inteiro, o trecho visível só varria de
     -12 a +12 graus. */
  const trilho = ScrollTrigger.create({
    trigger: el.closest(".rodape-marca") ?? el,
    start: celular ? "top bottom" : "top center-=120",
    end: celular ? "bottom top" : "bottom center+=120",
    onUpdate: (st) => {
      alvo = gsap.utils.interpolate(-amplitude, amplitude, st.progress);
      ultimaRolagem = performance.now();
    },
  });

  let visivel = false;
  const vista = new IntersectionObserver((entradas) => {
    visivel = entradas.some((e) => e.isIntersecting);
  });
  vista.observe(el);

  let pronto = false;
  const quadro = (tempo: number) => {
    if (!visivel && pronto) return;
    const parado = performance.now() - ultimaRolagem > 700;
    angulo += ((parado ? 0 : alvo) - angulo) * (parado ? 0.035 : 0.12);
    desenho.rotation.y = angulo + Math.sin(tempo * 0.7) * balanco;
    desenho.rotation.x = Math.sin(tempo * 0.45) * balanco * 0.35;
    renderer.render(cena, camera);
    if (!pronto) {
      pronto = true;
      aoPronto();
    }
  };
  gsap.ticker.add(quadro);

  return () => {
    gsap.ticker.remove(quadro);
    trilho.kill();
    vista.disconnect();
    medida.disconnect();
    geometria.dispose();
    material.dispose();
    renderer.dispose();
    tela.remove();
  };
}
