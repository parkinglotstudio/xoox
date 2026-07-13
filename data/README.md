# 데이터 테이블 안내

카피바라 고 실측(Day1~60) 기반 예시 데이터입니다. `weight` 컬럼의 숫자는 **실제 확률이 아니라 상대적 예시값**입니다 — 정확한 확률은 아직 미확인이라 임의로 채워둔 잠정치입니다. 밸런스가 확정되면 이 숫자만 교체하면 됩니다.

## 롤 파이프라인
1. `progression_phase_config` — 오늘이 며칠차인지로 구간(phase)을 찾아 combat_weight/content_weight로 전투 여부 결정
2. `content_type_config` — 비전투일 경우 콘텐츠 타입 결정
3. `grade_config` — 직접보상형/지역도착형일 경우 등급 결정
4. `daily_roll_pool` / `location_config` / `branch_config` / `minigame_reward_pool` — 최종 구체 효과(`effect_config` 참조) 결정

## 테이블 목록
- effect_config — 모든 보상/효과의 SSoT
- grade_config — 대박/중박/운빨망함/보너스
- content_type_config, progression_phase_config — 상위 롤 가중치
- event_text_pool — 날짜 무관 텍스트 풀
- daily_roll_pool — 직접보상형 콘텐츠
- location_config — 지역도착 이벤트
- branch_config — 분기선택 6서브타입
- minigame_config / minigame_reward_pool — 미니게임 4종
- combat_trigger_config — 전투 보상
- levelup_config — 레벨별 스킬 지급 방식
- skill_config — 스킬 등급/강화("+") 정의
- gauge_config — 대박/중박 누적 게이지
- milestone_config — 라이브 이벤트(마일스톤)
