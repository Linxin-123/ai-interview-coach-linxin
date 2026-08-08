<img width="2690" height="618" alt="image" src="https://github.com/user-attachments/assets/80a4b60a-8ee5-4f58-8535-bc9db36306c3" />17 files in total, but only 4 really matter. They are mapped below in reading order: 
types.ts (85) → No logic at all, only definitions of data shapes. In any TypeScript project this file is the fastest way to understand what the application actually deals with.
App.tsx (174) → Holds the one state variable that drives the whole app, loads the question bank, starts a session, and handles the AI-or-local decision.
scoring.ts (169) → Turns a transcript into three scores 
InterviewStage.tsx (298) → The interview screen. Contains all the speech machinery: speaking the question, listening to the answer, and measuring confidence and duration.

