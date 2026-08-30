from pathlib import Path
import shutil
import subprocess
import sys

src = Path(r"c:\Users\dmaxd\Downloads\계속_뒤만_보여주는_영상으로_제작해줘_구도를_동일하게.mp4")
print("exists", src.exists(), "size", src.stat().st_size if src.exists() else 0)
print("ffmpeg", shutil.which("ffmpeg"))
print("ffprobe", shutil.which("ffprobe"))
try:
    import cv2
    print("cv2", cv2.__version__)
except Exception as e:
    print("cv2", e)

out = Path(r"C:\xoox\docs\art\sprites\wanderer\_ref_video_frames")
out.mkdir(parents=True, exist_ok=True)
if shutil.which("ffprobe"):
    subprocess.run(["ffprobe", "-hide_banner", str(src)], check=False)
if shutil.which("ffmpeg") and src.exists():
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(src),
            "-vf", "fps=2,scale=720:-1",
            str(out / "frame_%03d.png"),
        ],
        check=False,
    )
    print("frames", len(list(out.glob("*.png"))))
