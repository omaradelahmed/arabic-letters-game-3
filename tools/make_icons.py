"""توليد أيقونات «شكل الحرف» — تشغيل:

    python tools/make_icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "icons"
OUT.mkdir(exist_ok=True)

S = 1024

PURPLE_TOP = (170, 150, 255)
PURPLE_BOT = (109, 74, 255)
AMBER = (255, 206, 84)
AMBER_EDGE = (255, 183, 3)
NAVY = (43, 35, 80)
WHITE = (255, 255, 255)
LILAC = (243, 239, 255)
VIOLET = (109, 74, 255)

FONT_CANDIDATES = [
    r"C:\Windows\Fonts\arialbd.ttf",
    r"C:\Windows\Fonts\tahomabd.ttf",
    r"C:\Windows\Fonts\segoeuib.ttf",
]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def background() -> Image.Image:
    img = Image.new("RGB", (S, S), PURPLE_BOT)
    draw = ImageDraw.Draw(img)
    for y in range(S):
        t = y / (S - 1)
        color = tuple(round(PURPLE_TOP[i] + (PURPLE_BOT[i] - PURPLE_TOP[i]) * t) for i in range(3))
        draw.line([(0, y), (S, y)], fill=color)
    return img


def rounded_mask(size: int, radius: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def draw_content(scale: float = 1.0) -> Image.Image:
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    cx, cy = S // 2, S // 2 - 30
    r = 300

    draw.ellipse([cx - r - 26, cy - r - 26, cx + r + 26, cy + r + 26], fill=WHITE)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=AMBER)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=AMBER_EDGE, width=18)

    font = load_font(520)
    glyph = "ك"
    box = draw.textbbox((0, 0), glyph, font=font)
    gw, gh = box[2] - box[0], box[3] - box[1]
    draw.text((cx - gw / 2 - box[0], cy - gh / 2 - box[1] - 6), glyph, font=font, fill=NAVY)

    # مربع الحرف الناقص (علامة الاستفهام)
    sx, sy, ss = 176, 742, 232
    draw.rounded_rectangle(
        [sx - 14, sy - 14, sx + ss + 14, sy + ss + 14], radius=58, fill=WHITE
    )
    draw.rounded_rectangle(
        [sx, sy, sx + ss, sy + ss], radius=46, fill=LILAC, outline=VIOLET, width=16
    )
    qfont = load_font(190)
    qbox = draw.textbbox((0, 0), "؟", font=qfont)
    qw, qh = qbox[2] - qbox[0], qbox[3] - qbox[1]
    draw.text(
        (sx + ss / 2 - qw / 2 - qbox[0], sy + ss / 2 - qh / 2 - qbox[1]),
        "؟",
        font=qfont,
        fill=VIOLET,
    )

    if scale != 1.0:
        inner = round(S * scale)
        layer = layer.resize((inner, inner), Image.LANCZOS)
        canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        off = (S - inner) // 2
        canvas.alpha_composite(layer, (off, off))
        layer = canvas

    return layer


def save(name: str, size: int, *, scale: float = 1.0, radius: int = 0) -> None:
    img = background().convert("RGBA")
    img.alpha_composite(draw_content(scale))
    img = img.convert("RGB").resize((size, size), Image.LANCZOS).convert("RGBA")
    if radius:
        img.putalpha(rounded_mask(size, radius))
    target = OUT / name
    img.save(target, format="PNG", optimize=True)
    print(f"{target.name}: {size}x{size}")


if __name__ == "__main__":
    save("icon-192.png", 192, radius=40)
    save("icon-512.png", 512, radius=104)
    save("icon-maskable-512.png", 512, scale=0.82)
    save("apple-touch-icon.png", 180)
    save("favicon-32.png", 32, radius=6)
