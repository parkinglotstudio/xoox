# wanderer test clips (7 named)

Packed bank for the sprite tool **and the field wanderer**.  
Does **not** replace files under `data/ui/actor/wanderer/` — those stay as fallback when a test clip is missing.

Field load (`loadActorSprite("wanderer")` / 들판·FPV·정화 툴) overlays these clips onto the matching actions:

| Test clip | In-game slot | When |
|-----------|--------------|------|
| `idle` | idle (was `ingame_idle`) | standing |
| `run` | move (was `move`) | WASD / auto-walk |
| `shoot` | shoot + aimFire (was `aim_fire`) | **Mouse Left** or **Z** (also auto-raid aim) |
| `throw` | throw | **Space** (no nearby node) |
| `pickup` | pickup (new) | field pickup burst |
| `victory` | victory (new) | raid / sector loop win |
| `fail` | fail (new) | raid / sector loop lose |

Loop: idle + run. One-shot (hold last): shoot / pickup / throw / victory / fail. Throw and pickup return to idle after the last frame; shoot holds last while the key/button is down, then idle; victory/fail hold until the bout ends.

When any test clip is present, production draw/holster/aim-walk/strafe sheets are **not** mixed in (512² vs 512×640 feet would slide). Strafe/back fall back to `run`.

**Space stays throw / node activate** — it is not rebound to shoot.

| Field | Value |
|-------|--------|
| canvas | 512×640 |
| pivot | bottom-center |
| foot anchor | (256, 624) |
| ids | `idle` `shoot` `run` `pickup` `throw` `victory` `fail` |
| loop | `idle` + `run` true; others false (hold last frame) |

480×480 gun-run frames are **not scaled**. Source bottom-center (240, 480) is pasted so it lands on (256, 624): offset **(16, 144)**.

Long clips wrap into a grid (max 8 columns, 4096px) so WebGL does not resize a 1-row strip (shoot was 18432px). UV math already uses `cols`/`rows`.

## How to run

Sprite tool:

```bash
npm run dev:wanderer-anim
```

Opens the **same** page as the old preview, on the test bank:

http://localhost:5173/wanderer-anim.html?bank=test

Click **아이들 / 총쏘기 / 달리기 / 줍기 / 던지기 / 승리 / 패배**. Red crosshair is the shared foot plant.

Without `?bank=test` (or after clicking **게임**) it still shows production `data/ui/actor/wanderer/` sheets — that is the old-looking bar, not a second tool.

Main field / prototype:

```bash
npm run dev          # lobby → 여정 (3D field)
npm run dev:fpv      # 3D 여정 뷰 프로토 (same wanderer loader)
```

Field keys: **WASD** move · **Mouse Left** or **Z** shoot · **Space** throw (or activate near a node) · **Enter** activate node · **V** view toggle.

## How to pack

Drop GIFs here (the only path the packer reads on the VM):

```
data/ui/wanderer/test_clips/_src/idle.gif
data/ui/wanderer/test_clips/_src/shoot.gif
data/ui/wanderer/test_clips/_src/run.gif
data/ui/wanderer/test_clips/_src/pickup.gif
data/ui/wanderer/test_clips/_src/throw.gif
data/ui/wanderer/test_clips/_src/victory.gif
data/ui/wanderer/test_clips/_src/fail.gif
```

```bash
python3 scripts/pack_wanderer_test_clips.py
```

Optional `{id}_sheet.png` fallback in the same folder (512×640 or 480×480 cell grid).

## Local refs (not on the VM)

- `C:\Users\dmaxd\xoox-anim-refs\user4_normalized\`
- `C:\Users\dmaxd\xoox-anim-refs\gun-run\game_ready\`
