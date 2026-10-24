"""샘플·B2 정면 실루엣 폭 비율 측정 (지시 3). python measure_outline.py <b2_front.png>
top = 폭이 최대의 35%를 처음 넘는 줄(아호게 제외) · end = 최대 폭 이후 폭이 70% 아래로 떨어지는 줄(가닥 끝)
높이 비율 f 위치의 폭 ÷ 머리 최대 폭(윗부분 0~0.6 구간 최대) 을 표로 출력."""
import sys
import numpy as np
from PIL import Image


def rows_of(path, crop=None):
    im = np.asarray(Image.open(path).convert("RGB")).astype(int)
    if crop:
        x0, y0, x1, y1 = crop
        im = im[y0:y1, x0:x1]
    bg = np.median(im[5:40, 5:40].reshape(-1, 3), axis=0)
    mask = np.abs(im - bg).sum(2) > 70
    w = np.zeros(im.shape[0])
    for y in range(im.shape[0]):
        xs = np.where(mask[y])[0]
        if len(xs) > 3:
            w[y] = xs.max() - xs.min()
    return w


def profile(w):
    mx = w.max()
    top = int(np.argmax(w > 0.35 * mx))
    ymax = int(np.argmax(w))
    end = ymax + int(np.argmax(w[ymax:] < 0.7 * mx))
    H = end - top
    head_max = w[top: top + int(0.6 * H)].max()
    out = {}
    for f in (0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.95):
        out[f] = w[top + int(f * H)] / head_max
    return out, H / head_max, head_max


samp = rows_of("ref_b2/sample.png", (0, 0, 1280 // 3, 720))
b2 = rows_of(sys.argv[1], (0, 60, None, -60) if False else None)
ps, hs, ms = profile(samp)
pb, hb, mb = profile(b2)
print("| 높이 위치 (위→가닥 끝) | 샘플 폭 비율 | B2 폭 비율 | 차이 |")
print("|---|---|---|---|")
for f in ps:
    print(f"| {int(f*100)}% | {ps[f]:.2f} | {pb[f]:.2f} | {pb[f]-ps[f]:+.2f} |")
print(f"| 전체 높이 ÷ 머리 최대 폭 | {hs:.2f} | {hb:.2f} | {hb-hs:+.2f} |")
