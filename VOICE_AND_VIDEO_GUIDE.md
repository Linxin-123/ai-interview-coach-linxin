# Voices & Digital-Human Video — what changed and how to extend it

## 1. Voices are now distinct and gender-correct

**The old bug:** `pickVoice()` chose a voice only by *accent prefix*. When an accent
had no installed voice (e.g. `en-AU` for Ethan), it silently fell back to the same
default English voice as David — so two or three interviewers sounded identical, and
gender was never considered at all (a male face could get a female voice).

**The fix (in `app.js`):** every interviewer now has a target **gender** + **accent** +
an ordered list of **preferred voice names**. The app infers each installed voice's
gender from its name, scores every voice, and assigns each interviewer a **different**
voice that matches their gender first, then accent.

| Interviewer | Gender | Accent target | Typical voice picked |
|-------------|--------|---------------|----------------------|
| **David**   | ♂ Male   | British (en-GB) | Google UK English Male / Microsoft George |
| **Sora** (was Sophia) | ♀ Female | US (en-US) | Google US English / Microsoft Aria / Jenny |
| **Ethan**   | ♂ Male   | US/AU       | Microsoft Guy / Mark / David |

Each card now shows a ♀/♂ tag and the actual voice name. The dropdown changes the
voice for the **currently selected** card and is labelled with gender too.

> ⚠️ Browser voices depend on the *visitor's* OS. On Windows+Chrome you'll have many
> (Microsoft George/Hazel/Guy, Google UK Male/Female…). On a bare machine there may be
> only one English voice — then the three can't all differ. For guaranteed, identical
> voices on every device, use pre-rendered MP4 clips (section 2) or a tiny TTS backend.

## 2. Photoreal "digital human asks the question" — free options

The app **already** supports this: drop `videos/<question_id>.mp4` into `videos/`
and that clip plays (with its own audio) when the question comes up; otherwise it
falls back to the live voice. Question IDs look like `m1_1` (marketing), `d1_1`
(data), `a1_1` (AI/ML).

Rendering one clip per question for the whole bank is impractical on free tiers — and
unnecessary, because live TTS already gives infinite questions for free. **Render a few
showcase clips** (e.g. each interviewer's opening question) and let the rest use TTS.

### Route A — No-code (fastest), free tier with limits/watermark
- **HeyGen** (free plan) or **D-ID Studio** (free trial): upload the interviewer photo
  (`interviewer_david.jpg` etc.) as a photo-avatar, type the question text, choose a
  voice that matches the gender/accent above, export MP4.
- Rename the file to the question id (e.g. `m1_1.mp4`) and put it in `videos/`.

### Route B — 100% free & unlimited (open-source, Google Colab free GPU) ✅ recommended
This also gives far better, fully controllable voices than the browser.

1. **Make the audio with Edge-TTS** (free Microsoft neural voices, exact gender/accent):
   ```bash
   pip install edge-tts
   # David — British male:
   edge-tts --voice en-GB-RyanNeural --text "Tell me about yourself." --write-media david_m1_1.mp3
   # Sora — US female:
   edge-tts --voice en-US-AriaNeural --text "Walk me through a project you led." --write-media sora_x.mp3
   # Ethan — Australian male (distinct from David):
   edge-tts --voice en-AU-WilliamNeural --text "Describe a system you designed." --write-media ethan_x.mp3
   ```
   (List all voices with `edge-tts --list-voices`.)
2. **Animate the photo with SadTalker** (search "SadTalker Colab" — official notebook):
   upload the interviewer photo + the matching `.mp3`, run the cells, download the
   result `.mp4`. SadTalker lip-syncs a single still photo to the audio.
   - Alternative: **Wav2Lip** Colab does the same job.
3. Rename to the question id and drop into `videos/` (e.g. `videos/m1_1.mp4`). Done.

Tip: keep clips short (the opening/most-asked question per role) so a few files cover
the moments that matter, and everything else stays free via live voice.
