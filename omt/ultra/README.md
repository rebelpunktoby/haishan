# 風雨殿 · OMT Site 殿境

**Temple of Wind and Rain — the architectural counterpart to OMT Engine.**
**風雨之殿 —— 山海的實體版。**

Concept stage. Nothing is built yet. Every sound here is a computer model.
概念階段。尚未建造。所有聲音皆為電腦模擬。

---

## What it is · 這是什麼

An eight-faced, temple-like building that wind, rain and sunlight play as an instrument. Nature plays; the building tunes and listens. Acoustic by default.

一座八面、似廟宇的建築，由風、雨與日光演奏。自然演奏，建築只負責調音與聆聽。預設為純聲學，不靠擴音。

| | EN | 繁 |
| --- | --- | --- |
| Harmony | One A pedal (55 and 110 Hz) on every wind face; each face adds three notes above 290 Hz that change what A means | 每個風面都有低音 A 持續音（55 與 110 Hz）；每面再加三個高於 290 Hz 的音，改變 A 的意義 |
| Facing | Eight faces follow the Later Heaven 八卦: four take the seasonal winds, 離 south takes the light, 坤 southwest is the entrance | 八面依後天八卦：四面迎季風，離（南）納光，坤（西南）為入口 |
| Rain | Gathered into drips, falling onto drained, tuned glass in a central skywell | 雨水匯集成滴，落在天井中已調音、可排水的玻璃上 |
| Light | Sun slits mark the hour and season; sun warms one pedal chamber so the pedal beats slowly by day | 光縫標示時辰與節氣；日照加熱一個持續音腔體，使白天出現緩慢拍音 |
| Base law | Spacing before scale: any scale works above the pedal if close intervals stay high or short | 先講間距，再講音階：密集音程放在高處或短促發聲，持續音之上任何音階皆可 |

## Model or measured · 模擬還是量測

Every claim carries one register. 每項主張都帶一個標籤。

| Register | Means | 意思 |
| --- | --- | --- |
| **[M]** Measured | Computed from standard acoustics; nothing measured on a built object yet | 由標準聲學公式計算，尚未在實物上量測 |
| **[T]** Traditional | 八卦, yin–yang, 時辰, 節氣 as organising grammar, never physics | 作為組織語法，絕不當作物理 |
| **[D]** Design choice | Owned by the author, revisable | 作者的選擇，可修訂 |
| **[H]** Hypothesis | Testable, not promised (H1–H3 below) | 可檢驗，不作承諾 |

No health or therapeutic claims. 不作任何健康或療效宣稱。

**Open hypotheses · 待驗證假設**
- H1 — Tuned pedal-and-colour wind sound is judged more pleasant than untuned wind tones. 經調音的風聲是否比未調音者更悅耳。
- H2 — The spacing law predicts how rough listeners rate a mix. 間距法則能否預測粗糙度評分。
- H3 — The slow sun beat on the pedal is heard as calm, not out of tune. 日照拍音聽來是平靜還是走音。

## Files · 檔案

| File | What | 說明 |
| --- | --- | --- |
| `index.html` | Showcase page, self-contained, EN/繁 toggle, live plan and sketch synth | 展示頁，單一檔案，中英切換，即時平面與聲音草圖 |
| `audio/door_simulation_slot_plus_room.mp3` | Model of the NYC door, 44 s (near, then across the room) | 紐約那扇門的模擬，44 秒 |
| `audio/tuning_A_harmonic.mp3` | Same weather, harmonic series on A, 32 s | 同一天氣，A 泛音列 |
| `audio/tuning_B_pentatonic.mp3` | Same weather, pentatonic, 32 s | 同一天氣，五聲音階 |
| `audio/tuning_C_equal_A13s11.mp3` | Same weather, piano-tuned A13(♯11), 32 s | 同一天氣，平均律 A13(♯11) |

## Docs · 文件

- Phase 1a — Feasibility Audit: https://claude.ai/artifact/VxK35g5t7RKAc33W2gZgBj
- Phase 1b-1 — Base Audit: https://claude.ai/artifact/1ADSHjXYVTVeMwbTnJJa5j
- Concept Brief v0.1: https://claude.ai/artifact/9GrSE1vUw3mwiUkjHNeFbT
- Showcase page: https://claude.ai/artifact/KYSkFm1CPi7xiwB96wqctn

These links are private until shared. 以上連結在分享前僅本人可見。

## Updating the page · 更新頁面

- All text lives in `index.html`. English sits in the HTML; Traditional Chinese sits in the `ZH` object near the top of the script, keyed by each element's `data-i`. Change both. 英文在 HTML 內；繁體在程式開頭的 `ZH` 物件，以 `data-i` 對應，兩邊都要改。
- Face voicings live in the `S` array (notes in Hz) and in the System table. Keep them in step with the Concept Brief. 各面配置在 `S` 陣列與系統表格，須與概念說明書一致。
- Rain voice: `GLASS` (pitches) and `this.drip` (attack, ring, level). 雨聲在 `GLASS` 與 `this.drip`。
- Hearing safety: master limiter, 9 kHz low-pass, 4 s fade-in. Keep these. 保留限幅、9 kHz 低通與 4 秒淡入。
- Lives at `/omt/ultra/` on oceanmountainlai.art. 位於 oceanmountainlai.art 的 `/omt/ultra/`。

## Next · 下一步

1. Build book PDF — long-form reference for the architect, portfolio and author. 建造手冊 PDF。
2. Door-sized test panel and the balcony home test — first real recordings. 門板測試牆與陽台實測。
3. Architect handoff deck. 建築師交接簡報。

---

© 2026 Toby Hysan · Beta, changes as the work does.
