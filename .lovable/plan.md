# Fix demo exit and real-feed back scrolling

## What will change
- Add an always-visible “Exit demo” control while demo mode is active, so Settings is not required to return to real content.
- Clear demo mode automatically when a user signs in, preventing it from reappearing on later logins.
- Keep ordinary backward scrolling unrestricted in demo mode.
- In the real feed only, allow one backward video step; a second consecutive backward step refreshes the feed instead of continuing through older viewed videos.

## Technical details
- Reuse the existing demo-mode state and storage helper so all open views update immediately.
- Reset the backward-step counter whenever the user resumes forward scrolling.
- Verify type safety and the signed-in/demo navigation behavior without changing unrelated feed or profile presentation.
