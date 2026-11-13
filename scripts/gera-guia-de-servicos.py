"""
O guia de serviços da Bruna, do PDF dela para o site (quinta rodada, 2026-11-13).

Uso, de dentro de site/:
    python -I scripts/gera-guia-de-servicos.py "caminho/para/Cora Perinatal Care Services Guide.pdf"

Faz três coisas, e é rodado de novo sempre que ela mandar um guia novo:
1. cada página vira uma WebP de 1600 px de largura em public/guia-de-servicos/ (a fonte que o
   next/image otimiza; 1600 cobre a coluna de 880 px numa tela de densidade 2);
2. o PDF ganha uma versão leve para o "Baixar o PDF": as imagens internas são recomprimidas a
   150 dpi, que ainda imprime bem, e o texto continua texto (selecionável, legível por leitor de tela);
3. escreve src/lib/guia-de-servicos.json, com o tamanho real de cada página, para a página do
   guia reservar o espaço antes de a imagem chegar.

Precisa de PyMuPDF e Pillow.
"""

import json
import pathlib
import sys

import pymupdf
from PIL import Image

LARGURA = 1600
QUALIDADE_PAGINA = 92
NOME_PDF = "cora-perinatal-care-services-guide.pdf"

SITE = pathlib.Path(__file__).resolve().parent.parent
SAIDA = SITE / "public" / "guia-de-servicos"
MANIFESTO = SITE / "src" / "lib" / "guia-de-servicos.json"


def main(origem: pathlib.Path) -> None:
    SAIDA.mkdir(parents=True, exist_ok=True)
    for velho in SAIDA.glob("pagina-*.webp"):
        velho.unlink()

    doc = pymupdf.open(origem)
    paginas = []
    for i, pagina in enumerate(doc, start=1):
        zoom = LARGURA / pagina.rect.width
        pix = pagina.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        nome = f"pagina-{i:02d}.webp"
        img.save(SAIDA / nome, "WEBP", quality=QUALIDADE_PAGINA, method=6)
        paginas.append({"arquivo": f"/guia-de-servicos/{nome}", "largura": pix.width, "altura": pix.height})
        trecho = " ".join(pagina.get_text().split())[:110]
        peso = (SAIDA / nome).stat().st_size / 1024
        print(f"  pagina {i:02d}: {pix.width}x{pix.height}, {peso:.0f} KB | {trecho}")

    leve = SAIDA / NOME_PDF
    try:
        doc.rewrite_images(dpi_threshold=200, dpi_target=150, quality=82)
    except AttributeError:
        print("  (esta versao do PyMuPDF nao recomprime imagens; o PDF sai so com a limpeza)")
    doc.save(leve, garbage=4, deflate=True, clean=True)
    doc.close()

    bytes_pdf = leve.stat().st_size
    MANIFESTO.write_text(
        json.dumps(
            {"pdf": {"arquivo": f"/guia-de-servicos/{NOME_PDF}", "bytes": bytes_pdf}, "paginas": paginas},
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"\n  PDF original: {origem.stat().st_size / 1048576:.1f} MB -> leve: {bytes_pdf / 1048576:.1f} MB")
    print(f"  {len(paginas)} paginas, manifesto em {MANIFESTO.relative_to(SITE)}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(pathlib.Path(sys.argv[1]).resolve())
