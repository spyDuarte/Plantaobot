# PlantãoBot — Claude Code Context

## Project Overview

**PlantãoBot v5** is a React-based UI prototype for a medical shift capture automation tool aimed at Brazilian doctors. It simulates a bot that monitors group chats (WhatsApp/Telegram), filters shift offers using user-defined preferences, and helps the user accept the best ones.

The entire application lives in a single file: **`plantaobot_6.jsx`** (~1,022 lines). To use it, copy it into a Vite/React project as `src/App.jsx`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Hooks |
| Charts | Recharts |
| Build | Vite (not included in repo) |
| Styling | Inline styles only (glassmorphism design system) |
| Language | Portuguese (pt-BR) |
| Tests | None currently |

---

## Setup & Running

```bash
# 1. Create a new Vite project
npm create vite@latest my-app -- --template react
cd my-app

# 2. Install required dependency
npm install recharts

# 3. Replace default App with PlantãoBot
cp plantaobot_6.jsx src/App.jsx

# 4. Start dev server
npm run dev
```

---

## Key Internal Architecture

| Symbol | Location | Purpose |
|--------|----------|---------|
| `C` | Lines 14–16 | Design token color palette (glassmorphism) |
| `SHIFTS`, `NOISE`, `GROUPS`, `MONTHLY`, `CAL` | Lines 26–45 | All hardcoded mock data |
| `fmt()`, `nowT()` | Lines 20–21 | Pure date/time utility functions |
| `calcScore()` | Lines 47–59 | Pure scoring function — evaluates shift offers |
| Micro-components | Lines 64–178 | `Av`, `Toggle`, `GlassCard`, `Pill`, `Waveform`, `Confetti`, `BgOrbs` |
| `ShiftCard` | Lines 181–224 | Modal for shift detail + accept/reject |
| `SwipeCard` | Lines 251–301 | Swipeable shift card (touch + mouse) |
| `InsightsPanel` | Lines 380–449 | Recharts-based financial dashboard |
| `AIChat` | Lines 312–378 | Chat panel (calls Anthropic API directly — see security note) |
| `App` | Lines 453–993 | God component: all state, routing, bot simulation, tab views |
| Bot simulation | Lines 491–523 | Fake message stream using `setTimeout` |

### Tab Views (all rendered inline inside `App`)
- `tab === 'dash'` — Dashboard with stats and quick actions
- `tab === 'feed'` — Live feed of shift offers from groups
- `tab === 'swipe'` — Manual swipe-to-accept review mode
- `tab === 'captured'` — List of accepted/captured shifts
- `tab === 'insights'` — Recharts financial analytics
- `tab === 'ai'` — AI chat assistant
- `tab === 'settings'` — Group toggles and preference sliders

---

## Git Workflow

- **Remote:** `http://local_proxy@127.0.0.1:29821/git/spyDuarte/Plantaobot`
- **Main branch:** `master`
- **Feature branches:** `claude/<description>-<id>`
- **Push command:** `git push -u origin <branch-name>`

---

## Conventions

- All UI strings are in **Portuguese (pt-BR)**
- **Inline styles only** — no CSS files, no CSS modules, no styled-components
- All state lives in the root `App` component (20+ `useState` hooks)
- Colors referenced via `C.*` tokens (e.g., `C.em`, `C.cy`, `C.bg0`)

---

## Improvement Roadmap

The following issues were identified by code analysis. Tackle them in priority order.

### Critical — Security & Correctness

1. **Move Anthropic API key to a backend proxy**
   - Problem: API key is exposed in client-side code (line 330)
   - Fix: Create a `/api/chat` backend endpoint; call that instead of `api.anthropic.com` directly

2. **Fix broken Accept button in shift modal**
   - Problem: "✓ Aceitar" button calls `onClose` and does nothing (line 220)
   - Fix: Implement actual accept logic — update state, show confirmation, (future) call backend

3. **Add input sanitization**
   - Problem: Chat input (line 380) and onboarding name field (line 547) have no validation or XSS protection
   - Fix: Sanitize/escape user input before rendering; validate length and content

---

### High Priority — Architecture

4. **Split the god `App` component into separate files**
   - Suggested file structure:
     ```
     src/
     ├── App.jsx                  (thin shell, routing only)
     ├── components/
     │   ├── Onboarding.jsx       (lines 543–642)
     │   ├── Dashboard.jsx        (lines 691–767)
     │   ├── FeedTab.jsx          (lines 770–808)
     │   ├── SwipeTab.jsx         (lines 811–830)
     │   ├── CapturedTab.jsx      (lines 833–874)
     │   ├── InsightsTab.jsx      (lines 877–905)
     │   ├── AIChatTab.jsx        (lines 907–910)
     │   ├── SettingsTab.jsx      (lines 912–976)
     │   ├── ShiftCard.jsx        (lines 181–224)
     │   ├── SwipeCard.jsx        (lines 251–301)
     │   └── InsightsPanel.jsx    (lines 380–449)
     ├── data/
     │   └── mockData.js          (SHIFTS, NOISE, GROUPS, MONTHLY, CAL)
     ├── utils/
     │   ├── calcScore.js         (lines 47–59)
     │   └── formatting.js        (fmt, nowT)
     └── constants/
         └── colors.js            (C token object)
     ```

5. **Replace 20+ useState hooks with useReducer**
   - Centralize app state into a reducer for easier testing and reasoning
   - Enables proper state reset between test runs

6. **Externalize mock data**
   - Move `SHIFTS`, `NOISE`, `GROUPS`, `MONTHLY`, `CAL` to `src/data/mockData.js`
   - Makes data easier to update without touching component code

7. **Add localStorage persistence**
   - Persist: user settings, group toggles, score weights, captured shifts, onboarding completion
   - Use a custom `useLocalStorage` hook

---

### Medium Priority — Features & UX

8. **Persist settings across sessions**
   - Group toggles (line 917–923) and preference sliders (line 929, 933) reset on refresh
   - Fix: Save to localStorage on change

9. **Add loading and error states**
   - Accepting a shift provides no feedback
   - Fix: Show spinner while processing, toast on success/error

10. **Implement real shift acceptance flow**
    - Accept/reject should mark shift as processed and prevent re-clicking
    - (Future) Send confirmation to backend

11. **Add useCallback and useMemo**
    - Memoize `toast` (line 480), `addNotif` (line 484), `calcScore` calls, and list renders
    - Prevent unnecessary re-renders in child components

12. **Fix timer cleanup on unmount**
    - Bot timers (lines 475–478) may leak if component unmounts during simulation
    - Fix: Ensure `clearAllTimers` is called in `useEffect` cleanup

---

### Lower Priority — Quality of Life

13. **Add ARIA labels for accessibility**
    - `Av` avatar (line 64), `Toggle` button (line 87), modal (line 185), all icon buttons
    - Modal should trap focus and return it on close

14. **Add unit tests**
    - `calcScore()`, `fmt()`, `nowT()` are pure functions — immediately testable
    - Suggested: Vitest + React Testing Library
    - Run tests: `npm test`

15. **Respect prefers-reduced-motion**
    - `Waveform` (lines 149–154) and `BgOrbs` (lines 441–447) animate unconditionally
    - Fix: Check `window.matchMedia('(prefers-reduced-motion: reduce)')`

16. **Add data export**
    - Allow users to export captured shifts as CSV or PDF
    - No backend required — use `Blob` API client-side

17. **Improve semantic HTML**
    - Onboarding flow should use `<form>` (lines 619–641)
    - Modal should use `<dialog>` element (line 185)
    - All `<input>` elements need associated `<label>` tags

---

### Future — Backend Integration

18. **Real WhatsApp/Telegram integration**
    - Replace `setTimeout` bot simulation (lines 491–523) with a real message stream API
    - Consider: WhatsApp Business API, Telegram Bot API, or a webhook listener

19. **Authentication**
    - Add login/session management before storing any real user data
    - Required before any backend integration

20. **Shift management API**
    - Backend CRUD for: available shifts, user preferences, captured shift history
    - Required for multi-device sync and data persistence

---

## Known Issues (Quick Reference)

| Issue | Location | Severity |
|-------|----------|---------|
| API key exposed client-side | Line 330 | Critical |
| Accept button does nothing | Line 220 | High |
| No input validation | Lines 380, 547 | High |
| All data is hardcoded mock | Lines 26–45 | High |
| 20+ useState in single component | Lines 454–473 | High |
| No localStorage persistence | Throughout | Medium |
| No tests | — | Medium |
| Timer leak risk on unmount | Lines 475–478 | Medium |
| No ARIA labels | Multiple | Medium |
| Animations ignore prefers-reduced-motion | Lines 149–154, 441–447 | Low |
