"""PWAアイコン(仮)を生成する。依存ライブラリなし。デザイン確定後に本番アイコンへ差し替える。
使い方: python scripts/generate-icons.py
「パクっと」= 口を開けた丸いキャラ。maskable は安全領域(中央80%)に収める。"""
import math, struct, zlib, os

BG = (168, 224, 200)   # #A8E0C8 パステルミント
FG = (251, 244, 228)   # #FBF4E4 クリーム
EYE = (75, 58, 46)     # #4B3A2E 焦げ茶

def render(size, scale_body, rounded):
    ss = 3  # スーパーサンプリング
    n = size * ss
    rows = []
    cx = cy = n / 2
    r = n * scale_body / 2
    mouth = math.radians(38)  # 口の開き(半角)
    for y in range(n):
        row = []
        for x in range(n):
            dx, dy = x + .5 - cx, y + .5 - cy
            col = BG
            if rounded:
                # 角丸の外側は透明扱いにせずBGのまま(maskableは全面塗り)
                pass
            d = math.hypot(dx, dy)
            if d <= r:
                ang = math.atan2(dy, dx)
                in_mouth = dx > 0 and abs(ang) < mouth
                if not in_mouth:
                    col = FG
                    ex, ey = cx + r * .05, cy - r * .5
                    if math.hypot(x + .5 - ex, y + .5 - ey) < r * .09:
                        col = EYE
            row.append(col)
        rows.append(row)
    out = []
    for py in range(size):
        line = bytearray([0])
        for px in range(size):
            rr = gg = bb = 0
            for j in range(ss):
                for i in range(ss):
                    c = rows[py * ss + j][px * ss + i]
                    rr += c[0]; gg += c[1]; bb += c[2]
            k = ss * ss
            line += bytes((rr // k, gg // k, bb // k))
        out.append(bytes(line))
    return b"".join(out)

def png(size, data):
    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(data, 9)) + chunk(b"IEND", b""))

here = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
for name, size, body in [("icon-192.png", 192, .72), ("icon-512.png", 512, .72),
                         ("icon-512-maskable.png", 512, .56), ("apple-touch-icon.png", 180, .68)]:
    with open(os.path.join(here, name), "wb") as f:
        f.write(png(size, render(size, body, False)))
    print("wrote", name)
