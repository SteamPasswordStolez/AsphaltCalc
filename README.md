# 🏎️ Asphalt Legends SimHub  
**Asphalt 9: Legends** 플레이어를 위한 통합 시뮬레이터 허브  
> Car Hunt / Full Star / Token Efficiency / Budget Simulation 등 다양한 계산기를 한곳에서  
> A unified simulator hub for **Asphalt 9: Legends** players — featuring Car Hunt, Full Star, and Budget simulators.

---

## 📁 프로젝트 개요 (Overview)
이 프로젝트는 **아스팔트 레전드(Asphalt 9)** 유저들이  
이벤트별 토큰 효율, 차량 완성 기댓값, 예산 등을 시뮬레이션할 수 있도록 만든 웹 기반 도구입니다.  
각 시뮬레이터는 독립적으로 작동하며, 공통 테마 시스템과 히스토리 기능을 공유합니다.

This project provides a web-based simulator for **Asphalt 9: Legends** players  
to analyze token efficiency, car completion probability, and event budgets.  
Each simulator runs independently but shares a unified theme and history system.

---

## 🧩 주요 시뮬레이터 (Simulators)
| 시뮬레이터 | 기능 요약 | Simulator | Description |
|-------------|-----------|------------|--------------|
| 🚗 **Car Hunt Simulator** | 청사진 드롭 확률 기반의 완성 시뮬레이션 및 히스토그램 표시 | Car Hunt | Simulates blueprint drop probabilities and displays histograms. |
| 💰 **Full Star Simulator** | 차량별 토큰 요구량 계산, 예산별 성공확률 시각화 | Full Star | Calculates token needs and visualizes success probability by budget. |
| ⚙️ **Main Hub** | 전체 시뮬레이터 목록과 설정(테마, 언어 등) 관리 | Main Hub | Integrates theme, language, and quick navigation for all tools. |

---

## 🧠 주요 기능 (Features)
- 🌗 **다크 / 라이트 / 네온 / 오로라 등 12종 테마**  
  **12 visual themes** including Dark, Light, Neon, and Aurora.  
- 💾 **히스토리 / 프리셋 저장** — 최근 시뮬레이션을 자동 저장  
  **History & Preset saving** for recent simulation states.  
- 📊 **실시간 그래프 및 확률 시각화**  
  **Dynamic charts** for probability visualization.  
- 📋 **결과 요약 및 복사 기능**  
  **Summary copy** (text, markdown, CSV).  
- 📱 **모바일 대응 / 반응형 디자인**  
  **Responsive design** for desktop & mobile.

---

## 📦 폴더 구조 (Folder Structure)
sim-hub-theme-settings/
├─ index.html # 메인 허브 / Main Hub
├─ assets/
│ ├─ theme-adapter.css # 공통 테마 및 반응형 스타일 / Theme system
│ └─ ...
└─ simulators/
├─ car-hunt.html # Car Hunt Simulator
└─ fullstar.html # Full Star Simulator

---

## 🎨 테마 프리뷰 (Theme Preview)
| 이름(Name) | 설명(Description) |
|-------------|------------------|
| **Asphalt Legends (Default)** | 네온 퍼플 + 딥다크 블랙 / Neon purple + deep dark black |
| **Aurora** | 청록-보라 그라데이션 / Cyan-Purple gradient |
| **Sunset** | 오렌지-보라 저녁빛 / Warm orange-purple sunset |
| **Onyx** | 클래식 다크 모드 / Pure dark |
| **Forest** | 그린 톤 / Forest green focus |

---

## 📜 버전 이력 (Version History)
| 버전 (Version) | 주요 변경점 (Highlights) |
|----------------|--------------------------|
| fix6 | 배지 스타일 및 색상 개선 / Badge and color refinement |
| fix7 | Car Hunt 히스토그램 개선, 모바일 가독성 향상 / Histogram & mobile UI improvements |
| fix8 | Fullstar 기능 확장 → 롤백 안정화 / Fullstar feature rollback for stability |
| current | 안정 빌드 (Fullstar 롤백 포함) / Current stable build |

---

## 💬 제작 정보 (Credits)
- **기획 & 개발 (Design & Dev):** Subitul & ChatGPT-5
- **사용 기술 (Tech Stack):** HTML · CSS · JavaScript (Vanilla)  
- **배포 (Deployment):** GitHub Pages

---

## 🪪 라이선스 (License)
이 프로젝트는 개인 학습 및 실험 목적으로 제작되었습니다.  
상업적 사용은 금지되며, 출처 표기 시 비상업적 재배포는 허용됩니다.  

This project is for personal learning and experimental use only.  
Commercial redistribution is prohibited, but non-commercial sharing with attribution is permitted.
