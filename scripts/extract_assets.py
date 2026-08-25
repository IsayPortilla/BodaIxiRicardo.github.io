from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]


def extract_styles(html: str) -> str:
    styles = re.findall(r"<style>(.*?)</style>", html, flags=re.S)
    return "\n\n".join(s.strip() for s in styles) + "\n"


def extract_scripts(html: str) -> list[str]:
    return [s.strip() for s in re.findall(r"<script>(.*?)</script>", html, flags=re.S)]


# invitacionv2
inv2 = (root / "invitacionv2.html").read_text(encoding="utf-8")
(root / "css" / "invitacionv2.css").write_text(extract_styles(inv2), encoding="utf-8")
scripts = extract_scripts(inv2)
confirm = scripts[0].replace(
    ',\n    "data/invitados.json"',
    "",
).replace(
    "// Excel en vivo (Google Sheet). Si falla la red, usa copia local.",
    "// Excel en vivo (Google Sheet) — unica dependencia externa",
)
(root / "js" / "confirmacion.js").write_text(confirm + "\n", encoding="utf-8")
(root / "js" / "invitacionv2.js").write_text(scripts[1] + "\n", encoding="utf-8")

# index
idx = (root / "index.html").read_text(encoding="utf-8")
(root / "css" / "index.css").write_text(extract_styles(idx), encoding="utf-8")

# enviar-mensajes
em = (root / "enviar-mensajes.html").read_text(encoding="utf-8")
(root / "css" / "enviar-mensajes.css").write_text(extract_styles(em), encoding="utf-8")
em_js = extract_scripts(em)[0].replace(
    ',\n            "data/invitados.json"',
    "",
).replace(
    "// Excel en vivo primero; JSON local solo como respaldo",
    "// Excel en vivo (Google Sheet) — unica dependencia externa",
)
(root / "js" / "enviar-mensajes.js").write_text(em_js + "\n", encoding="utf-8")

print("Extracted:")
for p in [
    "css/invitacionv2.css",
    "js/confirmacion.js",
    "js/invitacionv2.js",
    "css/index.css",
    "css/enviar-mensajes.css",
    "js/enviar-mensajes.js",
]:
    size = (root / p).stat().st_size
    print(f"  {p}: {size} bytes")
