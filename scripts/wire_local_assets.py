from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]


def strip_inline(html: str) -> str:
    html = re.sub(r"\s*<style>.*?</style>", "", html, flags=re.S)
    html = re.sub(r"\s*<script>.*?</script>", "", html, flags=re.S)
    return html


# invitacionv2
inv2 = strip_inline((root / "invitacionv2.html").read_text(encoding="utf-8"))
inv2 = inv2.replace(
    "<title>Ixi & Ricardo | 17.04.2027</title>",
    """<title>Ixi & Ricardo | 17.04.2027</title>
    <link rel="stylesheet" href="css/invitacionv2.css">
    <link rel="stylesheet" href="vendor/aos/aos.css">""",
)
inv2 = inv2.replace(
    "</body>",
    """    <script src="vendor/aos/aos.js" defer></script>
    <script src="js/confirmacion.js" defer></script>
    <script src="js/invitacionv2.js" defer></script>
</body>""",
)
(root / "invitacionv2.html").write_text(inv2, encoding="utf-8")

# index
idx = strip_inline((root / "index.html").read_text(encoding="utf-8"))
idx = idx.replace(
    "<title>Invitación: Ixi & Ricardo</title>",
    """<title>Invitación: Ixi & Ricardo</title>
    <link rel="stylesheet" href="css/index.css">""",
)
(root / "index.html").write_text(idx, encoding="utf-8")

# enviar-mensajes
em = strip_inline((root / "enviar-mensajes.html").read_text(encoding="utf-8"))
em = em.replace(
    "<title>Mensajes | Ixi & Ricardo</title>",
    """<title>Mensajes | Ixi & Ricardo</title>
    <link rel="stylesheet" href="css/enviar-mensajes.css">""",
)
em = em.replace(
    "</body>",
    """    <script src="js/enviar-mensajes.js" defer></script>
</body>""",
)
(root / "enviar-mensajes.html").write_text(em, encoding="utf-8")

print("HTML updated to use local css/ and js/")
