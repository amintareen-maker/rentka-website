from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "rentka-murree-carousel"
ASSETS = OUT / "assets"
W = H = 1080
NAVY = "#0F2B46"
GREEN = "#5BAE4A"
WHITE = "#FFFFFF"
INK = "#10283D"
MUTED = "#647482"
LIGHT = "#F3F7F5"
FONT = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")

def font(size, bold=False):
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT), size)

def cover(img, box):
    x, y, w, h = box
    scale = max(w / img.width, h / img.height)
    resized = img.resize((round(img.width * scale), round(img.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - w) // 2
    top = (resized.height - h) // 2
    return resized.crop((left, top, left + w, top + h))

def rounded_photo(canvas, name, box, radius=32):
    x, y, w, h = box
    photo = cover(Image.open(ASSETS / name).convert("RGB"), box)
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w, h), radius=radius, fill=255)
    canvas.paste(photo, (x, y), mask)

def wrap(draw, text, fnt, max_width):
    words, lines, line = text.split(), [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if draw.textbbox((0, 0), trial, font=fnt)[2] <= max_width:
            line = trial
        else:
            if line: lines.append(line)
            line = word
    if line: lines.append(line)
    return lines

def paragraph(draw, text, xy, fnt, color, width, gap=12):
    x, y = xy
    for line in wrap(draw, text, fnt, width):
        draw.text((x, y), line, font=fnt, fill=color)
        y += fnt.size + gap
    return y

def add_logo(canvas, x, y, width):
    logo = Image.open(ASSETS / "logo.png").convert("RGB")
    height = round(width * logo.height / logo.width)
    logo = logo.resize((width, height), Image.Resampling.LANCZOS)
    canvas.paste(logo, (x, y))
    return height

def brand_footer(canvas, slide, dark=False):
    d = ImageDraw.Draw(canvas)
    d.text((72, 1010), f"0{slide}", font=font(23, True), fill=WHITE if dark else GREEN)
    d.line((112, 1023, 945, 1023), fill=(255,255,255,90) if dark else "#DCE7E1", width=2)
    d.ellipse((974, 1009, 990, 1025), fill=GREEN)

def small_logo(canvas):
    add_logo(canvas, 72, 44, 245)

def slide1():
    im = cover(Image.open(ASSETS / "cover-road.png").convert("RGB"), (0,0,W,H))
    overlay = Image.new("RGBA", (W,H), (0,0,0,0)); od = ImageDraw.Draw(overlay)
    od.polygon([(0,0),(700,0),(530,H),(0,H)], fill=(15,43,70,232))
    od.rectangle((0,0,W,12), fill=GREEN)
    im = Image.alpha_composite(im.convert("RGBA"), overlay).convert("RGB")
    add_logo(im, 70, 48, 250)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((70,340,160,352), radius=6, fill=GREEN)
    d.text((70,390), "Islamabad", font=font(82,True), fill=WHITE)
    d.text((70,480), "to Murree", font=font(82,True), fill=WHITE)
    d.text((72,600), "Before You Go", font=font(45,True), fill="#A6D99C")
    d.line((72,674,420,674), fill=(255,255,255), width=2)
    d.text((72,704), "A quick guide for a smoother trip", font=font(28), fill=WHITE)
    brand_footer(im, 1, True); return im

def slide2():
    im=Image.new("RGB",(W,H),WHITE); d=ImageDraw.Draw(im); small_logo(im)
    d.rounded_rectangle((70,210,1010,875),radius=44,fill=LIGHT)
    d.text((115,255),"How Long Does It Take?",font=font(53,True),fill=NAVY)
    d.text((115,385),"Approx.",font=font(31,True),fill=GREEN)
    d.text((110,430),"1.5–2",font=font(142,True),fill=NAVY)
    d.text((570,505),"hours",font=font(53,True),fill=GREEN)
    # clock and route motif
    d.ellipse((720,360,900,540),outline=GREEN,width=14); d.line((810,450,810,397),fill=NAVY,width=12); d.line((810,450,858,476),fill=NAVY,width=12)
    d.arc((650,555,930,790),20,180,fill=NAVY,width=12); d.ellipse((650,650,675,675),fill=GREEN); d.ellipse((905,650,930,675),fill=GREEN)
    paragraph(d,"Under normal traffic and weather conditions.",(115,690),font(35),INK,520,10)
    brand_footer(im,2); return im

def slide3():
    im=Image.new("RGB",(W,H),WHITE); small_logo(im); rounded_photo(im,"sunrise-road.png",(480,190,530,690),36)
    d=ImageDraw.Draw(im); d.rounded_rectangle((70,255,590,770),radius=34,fill=WHITE,outline="#DFEAE4",width=3)
    d.text((115,305),"Leave Early",font=font(72,True),fill=NAVY); d.rectangle((115,405,225,417),fill=GREEN)
    paragraph(d,"Earlier departure usually means less traffic and more time in Murree.",(115,475),font(37),INK,400,16)
    brand_footer(im,3); return im

def car_icon(d, box, kind):
    x,y,w,h=box; roof = 0.32 if kind==0 else (0.23 if kind==1 else 0.15)
    d.rounded_rectangle((x+20,y+h*.45,x+w-20,y+h*.75),radius=28,outline=NAVY,width=8)
    d.polygon([(x+w*.26,y+h*.45),(x+w*(roof),y+h*.24),(x+w*.73,y+h*.24),(x+w*.84,y+h*.45)],outline=NAVY)
    d.ellipse((x+w*.22,y+h*.67,x+w*.36,y+h*.82),fill=NAVY); d.ellipse((x+w*.66,y+h*.67,x+w*.80,y+h*.82),fill=NAVY)

def slide4():
    im=Image.new("RGB",(W,H),WHITE); d=ImageDraw.Draw(im); small_logo(im)
    d.text((70,205),"Choose the Right Vehicle",font=font(58,True),fill=NAVY)
    labels=["Toyota Corolla","Honda BR-V","Toyota Prado"]
    for i,label in enumerate(labels):
        x=70+i*330; d.rounded_rectangle((x,335,x+300,700),radius=28,fill=LIGHT,outline="#DCE8E1",width=2)
        car_icon(d,(x+25,385,250,180),i); d.text((x+150,610),label,font=font(28,True),fill=INK,anchor="mm")
    paragraph(d,"Choose based on passengers, luggage and comfort.",(70,780),font(37),MUTED,900,12)
    brand_footer(im,4); return im

def slide5():
    im=cover(Image.open(ASSETS/"weather-road.png").convert("RGB"),(0,0,W,H)); ov=Image.new("RGBA",(W,H),(0,0,0,0)); od=ImageDraw.Draw(ov)
    od.rectangle((0,0,665,H),fill=(255,255,255,245)); im=Image.alpha_composite(im.convert("RGBA"),ov).convert("RGB"); small_logo(im); d=ImageDraw.Draw(im)
    d.text((70,275),"Check the",font=font(69,True),fill=NAVY); d.text((70,355),"Weather",font=font(69,True),fill=NAVY); d.rectangle((70,455,190,467),fill=GREEN)
    paragraph(d,"Murree weather can change quickly.",(70,515),font(38,True),INK,500,12)
    paragraph(d,"Check conditions before departure, especially in rain, fog or winter.",(70,655),font(31),MUTED,500,12)
    # weather icon
    d.ellipse((745,115,835,205),fill=(255,255,255)); d.ellipse((805,90,925,210),fill=(255,255,255)); d.ellipse((880,125,970,210),fill=(255,255,255)); d.rectangle((770,165,945,210),fill=WHITE)
    for x in (800,860,920): d.line((x,235,x-12,275),fill="#BBD9E5",width=8)
    brand_footer(im,5); return im

def slide6():
    im=Image.new("RGB",(W,H),WHITE); rounded_photo(im,"traffic-road.png",(70,440,940,500),34); small_logo(im); d=ImageDraw.Draw(im)
    d.text((70,205),"Weekend Traffic",font=font(64,True),fill=NAVY); d.text((70,278),"Can Build Up",font=font(64,True),fill=NAVY)
    paragraph(d,"Travel times may increase on weekends and public holidays.",(600,205),font(30),INK,410,10)
    d.rounded_rectangle((600,332,990,402),radius=16,fill=GREEN); d.text((795,367),"Plan extra time for busy travel days.",font=font(23,True),fill=WHITE,anchor="mm")
    brand_footer(im,6); return im

def slide7():
    im=Image.new("RGB",(W,H),NAVY); d=ImageDraw.Draw(im); d.rectangle((0,0,16,H),fill=GREEN)
    d.text((72,105),"Planning Your",font=font(72,True),fill=WHITE); d.text((72,185),"Murree Trip?",font=font(72,True),fill="#A8DB9E")
    d.text((72,315),"Book a car with driver through RentKA.",font=font(35),fill=WHITE)
    rounded_photo(im,"cover-road.png",(585,365,425,365),34)
    d.rounded_rectangle((70,405,525,720),radius=30,fill=WHITE); add_logo(im,100,445,395)
    d.text((72,800),"rentka.co",font=font(43,True),fill=WHITE); d.text((72,858),"0302 058 9999",font=font(43,True),fill=WHITE)
    d.text((72,930),"Islamabad & Rawalpindi",font=font(25),fill="#BFD0DD")
    brand_footer(im,7,True); return im

slides=[slide1,slide2,slide3,slide4,slide5,slide6,slide7]
for index, make in enumerate(slides,1):
    image=make(); image.save(OUT/f"rentka-murree-{index:02}.png",quality=95)
    assert image.size==(1080,1080)

thumbs=[]
for index in range(1,8):
    thumb=Image.open(OUT/f"rentka-murree-{index:02}.png").resize((360,360),Image.Resampling.LANCZOS)
    thumbs.append(thumb)
sheet=Image.new("RGB",(1080,1080),"#E8EFEC")
for index,thumb in enumerate(thumbs):
    sheet.paste(thumb,((index%3)*360,(index//3)*360))
sheet.save(OUT/"rentka-murree-contact-sheet.png",quality=92)
