# AI English Interview Coach

Clean two-column interview-practice app (React + Vite + Tailwind). Pick a role and a
coach, the digital human asks questions out loud, you answer by voice, and you get a
feedback report. Runs 100% free — no API key required (AI feedback is optional).

## What you can edit without touching code

**`public/interview-data.json`** is the whole question bank + the coaches.
Edit it, save, refresh the browser — done. No rebuild needed.

```jsonc
{
  "roles":        [ { "id": "marketing", "title": "...", "subTitle": "...", "icon": "📢", "description": "..." } ],
  "interviewers": [ { "id": "david", "name": "David", "role": "Senior Hiring Recruiter",
                      "image": "images/interviewer_david.jpg",
                      "accent": "en-GB", "gender": "male",
                      "voiceHints": ["google uk english male","microsoft george"],
                      "description": "..." } ],
  "questions":    [ { "id": "m1_1", "role": "marketing", "round": 1,
                      "text": "Tell me about yourself...", "scenario": "Intro" } ]
}
```
Rules: a question's `role` must match a `roles[].id`; `round` is 1, 2 or 3. To add a
question, copy a block and change `id`/`text`. To add a coach, copy a block, set a
unique `id`, drop a photo in `public/images/`, set `gender` ("male"/"female") and
`accent`.

## Voices (now distinct + gender-correct)

The browser's Speech API doesn't expose gender, so the app infers it from each voice's
name and assigns every coach a **different** voice that matches their gender first, then
accent (`src/lib/voices.ts`). On the welcome screen each coach shows a ♀/♂ tag and its
voice; the dropdown overrides the selected coach's voice, and **Preview** plays a sample.

> Browser voices depend on the visitor's computer. Your machine has many (Microsoft/
> Google), so all three differ cleanly. On a bare machine with one English voice they
> can't all differ — use the optional MP4 clips below for guaranteed voices everywhere.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000  (AI feedback falls back to local if no key)
```

## Deploy free to GitHub Pages

```bash
npm run build      # outputs a static site to dist/
```
Then either push the `dist/` contents to your `gh-pages` branch, or add the workflow in
`.github/workflows/deploy.yml` (included) and enable Pages → "GitHub Actions". `base` is
already set to `'./'`, so it works on a project page (`user.github.io/repo/`).

## Live 3D digital-human coaches (Route B — built in)

The interview screen renders a **live 3D avatar** (three.js) that moves its mouth while
the coach speaks, blinks, and nods attentively while you answer — no API key, no server.
It's driven by the same free browser voice. If an avatar can't load, the coach's photo is
shown instead, so the app never breaks.

Each coach has a `model` field in `public/interview-data.json` — a **Ready Player Me** .glb
URL. A shared demo avatar is filled in so it works right away; give each coach their own
(2 minutes, free):

1. Go to **https://readyplayer.me** and click *Create Avatar* (no account needed for a
   guest avatar). Make a male avatar for David, a female one for Sora, another male for Ethan.
2. When done, copy the avatar's **.glb link** (e.g. `https://models.readyplayer.me/XXXX.glb`).
3. In `public/interview-data.json`, set that coach's `model` to the link, and **keep the
   `?morphTargets=ARKit,Oculus Visemes` suffix** — that's what lets the mouth and eyes move:
   ```json
   "model": "https://models.readyplayer.me/XXXX.glb?morphTargets=ARKit,Oculus Visemes"
   ```
4. Save and refresh. To use the photo instead for a coach, delete its `model` line.

> Note: Ready Player Me avatars are stylized 3D people (not photoreal). That's the trade-off
> of a free, live, in-browser avatar — the mouth and reactions are real-time, which is what
> a still photo can't do.

### Optional upgrade: even more lifelike
For co-articulated lip-sync plus moods and hand gestures, the **TalkingHead** library
(github.com/met4citizen/TalkingHead) drives the same Ready Player Me avatars. It looks best
with a TTS that returns word timings (e.g. Google/Microsoft cloud TTS), so it's an upgrade
path rather than the zero-setup default used here.

## Feedback: real evaluation (free) + optional AI (also free)

**Without any key (default):** when you finish a round, the app analyzes your *actual*
spoken transcript and gives real, per-round feedback on three dimensions:
- **Pronunciation / clarity** — estimated from the speech recognizer's confidence.
  (True phoneme-level pronunciation scoring needs a paid speech service; this is a
  clarity proxy and is labelled as an estimate.)
- **Fluency** — from your pace (words/min) and filler words (um / like / you know).
- **Relevance** — how well each answer overlapped with what the question asked.
Plus a varied encouragement each round and a fireworks celebration when you actually speak.

**With a free Gemini key (professional AI feedback):** for richer, tailored commentary
and STAR rewrites, get a free key from Google AI Studio (aistudio.google.com → "Get API
key"), then create a file named `.env` in the project root containing:
```
GEMINI_API_KEY=your_key_here
```
Restart `npm run dev`. Now the app sends your real answers to Gemini and returns
professional pronunciation/fluency/relevance notes and phrase upgrades. If the AI call
ever fails, it automatically falls back to the local analysis above. (If you get a model
error, open `server.ts` and set `model` to a current one, e.g. `gemini-2.5-flash`.)
