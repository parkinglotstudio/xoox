# Sprite Engine

애니메이터 없이 **스틸샷 → 512셀 시트+JSON** 팩을 만든다.  
사람 입구 문서: [`docs/art/sprites/_guide/02_TOOLS.md`](../../docs/art/sprites/_guide/02_TOOLS.md)

## 폴더 규칙

```
docs/art/sprites/{char}/engine/
  {id}/
    frames/
    {id}_sheet.png
    {id}.json
    preview.html          # 선택
    _pre_scale_backup/    # 스케일 기준본 (있으면 유지)
    _pre_offset_backup/   # 오프셋 기준본 (있으면 유지)
  index.json
  studio.html · align.html · scale.html
```

작업용 키포즈: `ingame/.../frames_ai/`  
**게임은 `engine/`만.**

## 명령

```bash
python3 scripts/sprite_tool/sprite_engine.py studio --char hyanga

python3 scripts/sprite_tool/sprite_engine.py build \
  --char hyanga --id hop \
  --frames-dir docs/art/sprites/hyanga/ingame/hop/frames_ai \
  --cell 512 --pivot bottom-center --duration-ms 120 --preview

python3 scripts/sprite_tool/sprite_engine.py rebuild \
  --manifest docs/art/sprites/hyanga/engine/hop/hop.json

python3 scripts/sprite_tool/apply_frame_adjust.py \
  --anim-dir docs/art/sprites/hyanga/engine/lose \
  --scales path/to/frame_scales.json

# 에디터 저장과 동일 (절대 스케일+오프셋 → 팩)
python3 scripts/sprite_tool/apply_editor_pack.py \
  --anim-dir docs/art/sprites/generals/guanyu/engine/attack_b \
  --scales path/to_frame_scales.json \
  --offsets path/to_body_offsets.json
```

**메인 에디터 (저장→엔진 반영):**

```bash
python3 scripts/sprite_tool/editor_server.py --char guanyu --port 8767
# http://127.0.0.1:8767/editor.html  →  「엔진에 저장」
```

구 미리보기만: `python3 -m http.server 8765 --directory docs/art/sprites/hyanga/engine`  
→ `studio.html` / `align.html` / `scale.html` (저장 API 없음)
