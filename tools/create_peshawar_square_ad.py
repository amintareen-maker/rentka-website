from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(r"C:\Users\eZhire\RentKA-Website")
BASE = Path(r"C:\Users\eZhire\.codex\generated_images\019f8866-8376-7e50-8c87-6336f1a05f54\exec-882d4d8f-9752-4d80-ad03-574d27791393.png")
LOGO = ROOT / "public" / "logo.png"
OUT = ROOT / "public" / "ads" / "phase-4" / "islamabad-to-peshawar-1080x1080.png"

DARK_BLUE = "#0F2B46"
GREEN = "#5BAE4A"
PALE_GREEN = "#E8F4E5"
WHITE = "#FFFFFF"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "arialbd.ttf" if bold else "arial.ttf"
    return ImageFont.truetype(str(Path(r"C:\Windows\Fonts") / name), size)


def contain(image: Image.Image, width: int, height: int) -> Image.Image:
    ratio = min(width / image.width, height / image.height)
    size = (round(image.width * ratio), round(image.height * ratio))
    return image.resize(size, Image.Resampling.LANCZOS)


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas = Image.open(BASE).convert("RGB").resize((1080, 1080), Image.Resampling.LANCZOS)

    # Quiet translucent field keeps the prescribed dark-blue type readable while
    # retaining the road and sky below it.
    veil = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    vd = ImageDraw.Draw(veil)
    vd.rounded_rectangle((42, 42, 666, 754), radius=34, fill=(255, 255, 255, 218))
    veil = veil.filter(ImageFilter.GaussianBlur(1.2))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), veil)
    draw = ImageDraw.Draw(canvas)

    # Official logo is only resized proportionally; its artwork is not recreated.
    logo = Image.open(LOGO).convert("RGBA")
    logo = contain(logo, 220, 80)
    canvas.alpha_composite(logo, (72, 72))

    draw.multiline_text(
        (72, 226),
        "ISLAMABAD TO\nPESHAWAR",
        font=font(68, bold=True),
        fill=DARK_BLUE,
        spacing=4,
    )
    draw.text(
        (72, 402),
        "Chauffeur-Driven",
        font=font(36, bold=True),
        fill=DARK_BLUE,
    )
    draw.text(
        (72, 446),
        "Car Rental",
        font=font(36, bold=True),
        fill=DARK_BLUE,
    )

    draw.rounded_rectangle((72, 512, 467, 562), radius=10, fill=PALE_GREEN)
    draw.text(
        (91, 522),
        "One-Way & Return Trips",
        font=font(28),
        fill=DARK_BLUE,
    )

    # Exact requested 210 x 64 CTA.
    draw.rounded_rectangle((72, 928, 282, 992), radius=18, fill=GREEN)
    label = "BOOK NOW"
    label_font = font(28, bold=True)
    box = draw.textbbox((0, 0), label, font=label_font)
    tw, th = box[2] - box[0], box[3] - box[1]
    draw.text((177 - tw / 2, 960 - th / 2 - 3), label, font=label_font, fill=WHITE)
    draw.text((306, 944), "03020589999", font=font(30, bold=True), fill=DARK_BLUE)

    canvas.convert("RGB").save(OUT, quality=95)
    print(OUT)


if __name__ == "__main__":
    main()
