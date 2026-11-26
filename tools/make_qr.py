"""توليد كود QR وورقة A4 قابلة للطباعة للعبة «شكل الحرف».

    python tools/make_qr.py
"""

from pathlib import Path

import arabic_reshaper
import qrcode
from bidi.algorithm import get_display
from qrcode.constants import ERROR_CORRECT_H
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

URL = "https://omaradelahmed.github.io/arabic-letters-game-3/"
URL_PRETTY = "omaradelahmed.github.io/arabic-letters-game-3"

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "qr"
OUT.mkdir(exist_ok=True)

NAVY = HexColor("#2b2350")
BRAND = HexColor("#6d4aff")
BRAND_SOFT = HexColor("#f0ecff")
GREEN = HexColor("#2fbf71")
GREY = HexColor("#6b6a8a")

FONT_DIR = Path(r"C:\Windows\Fonts")
pdfmetrics.registerFont(TTFont("Arabic", str(FONT_DIR / "tahoma.ttf")))
pdfmetrics.registerFont(TTFont("Arabic-Bold", str(FONT_DIR / "tahomabd.ttf")))


def ar(text: str) -> str:
    return get_display(arabic_reshaper.reshape(text))


def make_qr_image() -> Path:
    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, box_size=28, border=4)
    qr.add_data(URL)
    qr.make(fit=True)
    image = qr.make_image(fill_color="#2b2350", back_color="white")
    if hasattr(image, "get_image"):
        image = image.get_image()
    image = image.convert("RGB")
    path = OUT / "hurouf3-qr.png"
    image.save(path)
    print(f"{path.name}: {image.size[0]}x{image.size[1]}")
    return path


def rounded(c: canvas.Canvas, x, y, w, h, radius, color):
    c.setFillColor(color)
    c.roundRect(x, y, w, h, radius, stroke=0, fill=1)


def draw_poster(c: canvas.Canvas, qr_path: Path) -> None:
    width, height = A4

    def top(mm_value: float) -> float:
        return height - mm_value * mm

    rounded(c, 16 * mm, top(50), width - 32 * mm, 40 * mm, 10, BRAND)
    c.setFillColor(HexColor("#ffffff"))
    c.setFont("Arabic-Bold", 42)
    c.drawCentredString(width / 2, top(36), ar("شكل الحرف"))
    c.setFont("Arabic", 15)
    c.drawCentredString(width / 2, top(45), ar("حروفي ٣ — اختار شكل الحرف في مكانه"))

    c.setFillColor(NAVY)
    c.setFont("Arabic-Bold", 20)
    c.drawCentredString(width / 2, top(62), ar("امسح الكود بكاميرا الموبايل وابدأ اللعب"))

    size = 96 * mm
    x = (width - size) / 2
    y = top(174)
    rounded(c, x - 6 * mm, y - 6 * mm, size + 12 * mm, size + 12 * mm, 7, BRAND_SOFT)
    c.drawImage(str(qr_path), x, y, width=size, height=size, preserveAspectRatio=True, mask="auto")

    c.setFillColor(BRAND)
    c.setFont("Arabic-Bold", 13)
    c.drawCentredString(width / 2, top(191), URL_PRETTY)

    bullets = [
        "مناسب للأطفال من 3 إلى 6 سنوات",
        "شكل الحرف في أول الكلمة ووسطها وآخرها",
        "يشتغل بدون إنترنت بعد أول فتح",
        "مجاني — بدون إعلانات ولا حسابات",
    ]
    for index, line in enumerate(bullets):
        cy = top(205 + index * 9.5)
        c.setFillColor(GREEN)
        c.circle(width - 26 * mm, cy + 1.2 * mm, 2.2 * mm, stroke=0, fill=1)
        c.setFillColor(NAVY)
        c.setFont("Arabic", 13.5)
        c.drawRightString(width - 32 * mm, cy, ar(line))

    rounded(c, 20 * mm, top(276), width - 40 * mm, 30 * mm, 8, BRAND_SOFT)
    c.setFillColor(NAVY)
    c.setFont("Arabic-Bold", 14)
    c.drawCentredString(width / 2, top(252), ar("ثبّت اللعبة على الشاشة الرئيسية"))
    c.setFillColor(HexColor("#453a70"))
    c.setFont("Arabic", 11.5)
    c.drawCentredString(width / 2, top(261), ar("من قائمة المتصفح اختار «إضافة إلى الشاشة الرئيسية»"))
    c.setFont("Arabic", 10.5)
    c.drawCentredString(width / 2, top(269), ar("وعلى الآيفون: زر المشاركة ثم Add to Home Screen"))

    c.setFillColor(GREY)
    c.setFont("Arabic", 9)
    c.drawCentredString(width / 2, top(291), "github.com/omaradelahmed/arabic-letters-game-3")

    c.showPage()


def draw_cards(c: canvas.Canvas, qr_path: Path) -> None:
    width, height = A4
    margin = 12 * mm
    gap = 7 * mm
    card_w = (width - 2 * margin - gap) / 2
    card_h = (height - 2 * margin - 2 * gap) / 3

    c.setFillColor(NAVY)
    c.setFont("Arabic-Bold", 13)
    c.drawCentredString(width / 2, height - 9 * mm, ar("كروت للقص — 6 نسخ"))

    for row in range(3):
        for col in range(2):
            x = margin + col * (card_w + gap)
            y = margin + row * (card_h + gap)

            c.setStrokeColor(HexColor("#c9bcff"))
            c.setDash(3, 3)
            c.setLineWidth(0.8)
            c.roundRect(x, y, card_w, card_h, 6, stroke=1, fill=0)
            c.setDash()

            c.setFillColor(NAVY)
            c.setFont("Arabic-Bold", 20)
            c.drawCentredString(x + card_w / 2, y + card_h - 12 * mm, ar("شكل الحرف"))

            c.setFillColor(GREY)
            c.setFont("Arabic", 9.5)
            c.drawCentredString(x + card_w / 2, y + card_h - 18 * mm, ar("حروفي ٣"))

            qr_size = min(card_w - 40 * mm, 44 * mm)
            c.drawImage(
                str(qr_path),
                x + (card_w - qr_size) / 2,
                y + 16 * mm,
                width=qr_size,
                height=qr_size,
                preserveAspectRatio=True,
                mask="auto",
            )

            c.setFillColor(BRAND)
            c.setFont("Arabic-Bold", 7.4)
            c.drawCentredString(x + card_w / 2, y + 11 * mm, URL_PRETTY)

            c.setFillColor(NAVY)
            c.setFont("Arabic", 8.5)
            c.drawCentredString(x + card_w / 2, y + 6 * mm, ar("امسح الكود وابدأ اللعب"))

    c.showPage()


def main() -> None:
    qr_path = make_qr_image()

    pdf_path = OUT / "hurouf3-qr-a4.pdf"
    c = canvas.Canvas(str(pdf_path), pagesize=A4)
    c.setTitle("شكل الحرف — كود اللعبة")
    c.setAuthor("Omar Adel")

    draw_poster(c, qr_path)
    draw_cards(c, qr_path)

    c.save()
    print(f"{pdf_path.name}: صفحتان A4")


if __name__ == "__main__":
    main()
