# How to add photoreal MP4 clips (optional)

The app already supports talking-head video. For any question, drop a file named
`videos/<question_id>.mp4` here. When that question comes up, the clip plays with
its own audio; if no clip exists, the app falls back to the live browser voice.

Example: a clip for question id `m1_7` -> `videos/m1_7.mp4`

You do NOT need a clip for every question. Render only a few "showcase" ones
(e.g. each interviewer's opening question) and let the rest use live TTS.
