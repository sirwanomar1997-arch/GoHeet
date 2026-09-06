# Reelzy

I want to create REELZY - Real moments.



REELZY — REAL MOMENTS

Product vision

Build Reelzy as a serious, production-ready social media platform designed around one simple idea:

REAL LIFE. REAL PEOPLE. REAL MOMENTS.

Reelzy is a short-form social video platform where people capture and share moments from their actual lives.

The defining product principle is:

Content must originate inside Reelzy.

Users must NOT be able to upload photos or videos from their camera roll.

A user opens Reelzy → uses the Reelzy camera → captures a moment → performs limited editing → posts it.

The goal is not to create another TikTok, Instagram, Snapchat, or BeReal clone.

Reelzy should feel like a completely new social category built around spontaneous real-life moments.



1. IMPORTANT PRODUCT PHILOSOPHY

Do not build Reelzy as a visual clone of an existing social network.

Avoid copying:

TikTok’s UI

Instagram’s UI

Snapchat’s UI

BeReal’s UI

Instagram-style profile grids

TikTok-style right-side action stacks

Generic neon “AI startup” aesthetics

Generic glassmorphism

Excessive gradients

Generic social-media cards

Create a distinctive Reelzy design language.

The product should feel:

Premium

Bold

Fun

Human

Modern

Slightly unconventional

Highly recognizable

Simple enough to use immediately

Sophisticated enough to feel like a major global platform

The emotional reaction should be:

“What is this? I want to try it.”

Reelzy should feel like a place where people go to see what other people are ACTUALLY doing.



2. FIRST VERSION GOAL

The first version should focus on building a strong user base and making the core product genuinely usable.

Do NOT overbuild monetization or advanced financial functionality yet.

The initial priorities are:

Users discover Reelzy

Users register

Users create profiles

Users discover other people

Users follow people

Users open the Reelzy camera

Users capture moments

Users make limited edits

Users publish moments

Other users watch them

Users interact with moments

Users return to the app

Users build followers and following

Users discover new creators and real-life moments

The architecture should nevertheless be designed so future features can be added without rebuilding the entire application.

Future functionality may include:

Payments

Creator monetization

Subscriptions

Advertising

Premium features

Gifts/tipping

Business accounts

Creator tools

Advanced analytics

More moderation systems

Additional content formats

Messaging

Live video

Events

Marketplace functionality

Do not implement these prematurely unless necessary for the architecture.

Build the foundation correctly now.



3. PRODUCTION-READY MINDSET

This is extremely important:

Do not treat this as a mockup or demo.

Build the application architecture as if Reelzy is intended to become a real global social platform.

The application should have:

Real authentication

Real database persistence

Real user accounts

Real profiles

Real content storage

Real video processing/storage architecture

Real follows

Real likes

Real comments

Real views

Real saves

Real reporting

Real blocking

Real moderation foundations

Real privacy controls

Real account deletion

Real security practices

Real age restrictions

Real terms/privacy consent

Real backend validation

Proper authorization

Proper error handling

Scalable architecture

Do not rely on frontend-only security.

Every important permission and business rule must also be enforced server-side/backend-side.



4. AGE REQUIREMENT — 13+

Reelzy is intended for users aged 13 and older.

Implement age gating during registration.

Users must confirm that they meet the minimum age requirement.

The system should store the user’s date of birth or appropriate age-verification state.

Users under 13 must not be permitted to create an account.

Design the architecture so additional age-related protections can be introduced later.

The product should also include appropriate safeguards for younger users, including privacy and discoverability controls where appropriate.

Do not knowingly collect unnecessary sensitive information from minors.



5. AUTHENTICATION

Implement a real authentication system.

Users should be able to register and sign in securely.

Initial options can include:

Email

Password

Username

Date of birth

Consider supporting:

Email verification

Password reset

Secure sessions

Sign out

Account recovery

Optional social login later

Do not store passwords insecurely.

Authentication must be handled using a proper authentication provider/backend rather than custom insecure password handling.



6. USERNAME SYSTEM

Every user should have a unique username.

Username requirements should include:

Unique usernames

Reasonable length limits

Allowed character rules

Reserved usernames

Protection against impersonation

Case-insensitive uniqueness

Users should be able to change their username according to reasonable platform rules.



7. USER PROFILE

Profiles should NOT look like Instagram.

The profile should feel like a person’s real-life timeline.

Show:

Profile photo

Username

Display name

Bio

Followers

Following

Total views

Number of moments

Follow/unfollow

Profile sharing

Report/block actions

Instead of thinking:

“Influencer portfolio”

the profile should communicate:

“This is this person’s life.”

Create an original visual structure for the person’s moments.

Avoid simply creating a standard 3-column Instagram grid.



8. REELZY CAMERA

The camera is one of the most important parts of the entire product.

The Reelzy camera should be a core identity element.

There must be:

NO camera-roll upload button.

Do not provide:

“Upload”

“Choose from gallery”

“Select from camera roll”

Photo/video picker for existing media

The primary capture flow must be:

Open Reelzy → Camera → Capture → Edit → Post

The UI should make the camera feel like the heart of Reelzy.

Support normal capture functionality such as:

Front/rear camera

Flash

Recording

Photo/video where appropriate

Start/stop recording

Camera switching

Basic trimming

Basic text

Basic stickers

Basic sound/audio controls

Basic filters/effects if appropriate

However, editing should remain intentionally limited.

The goal is not to turn Reelzy into a professional video editor.

The limitation is part of the authenticity philosophy.



9. CONTENT AUTHENTICITY ARCHITECTURE

This is a fundamental technical requirement.

A Reelzy post should contain metadata showing that it originated through the Reelzy camera/capture system.

Do not simply trust a frontend flag such as:

“isReelzyCaptured = true”

because that can be manipulated.

The backend should validate the publishing process.

Design the content pipeline so that:

Recording begins inside Reelzy

Media is captured through the Reelzy capture flow

Media receives appropriate server-side metadata

The backend validates the publishing request

The resulting Reelzy moment is stored as platform-originated content

Do not provide a normal media upload API that allows users to circumvent the camera requirement.

If technically necessary for web/PWA limitations, clearly architect the platform so native Reelzy applications can enforce the strongest camera-only capture model.

The product should be designed with a future native iOS/Android implementation in mind.



10. NO AI-GENERATED VIDEO

AI-generated videos should not be a content category on Reelzy.

Do not build AI video generation into the platform.

Do not create an AI content creation workflow.

The brand should be based around human-created real-life moments.

AI can potentially be used internally in the future for things such as:

Safety moderation

Spam detection

Content classification

Recommendation systems

But AI should not become a mechanism for users to manufacture fake “real-life” moments.



11. MAIN FEED

Create a vertical short-form video feed.

However, do NOT copy TikTok’s interface.

There should be two primary experiences:

Following

Moments from people the user follows.

Discover / For You

Recommended moments from the broader Reelzy community.

The feed should feel more like discovering fragments of people’s lives than consuming polished entertainment content.

Every moment should clearly display its view count.

Example conceptual metadata:

1,284 views

But present views elegantly as part of the Reelzy visual language rather than copying existing platforms.



12. INTERACTIONS

Users should be able to:

Like

Comment

Share

Save

Follow

View profile

Report

Block

Mute where appropriate

Do NOT automatically copy the standard vertical:

❤️
💬
↗
🔖

stack from TikTok.

Invent a more distinctive interaction system.

Interactions could become part of the content surface, bottom information area, expandable controls, gesture interactions, or another original structure.

The UI should remain extremely easy to understand.

Innovation should not come at the expense of usability.



13. VIEWS

Views are an important social metric on Reelzy.

Every published moment should track views.

The system should distinguish between:

Video plays

Qualified/meaningful views if appropriate

Total views

Creator’s total profile views

Do not simply increment views endlessly every time the frontend renders a component.

Create sensible backend logic to reduce artificial inflation.

Design the database so view analytics can become more sophisticated later.



14. COMMENTS

Implement real comments.

Comments should support:

Create

Read

Delete own comment

Report comment

Moderation

Basic abuse prevention

Rate limiting

Architecture should allow future:

Comment replies

Comment likes

Comment moderation tools



15. FOLLOW SYSTEM

Implement:

Follow

Unfollow

Followers list

Following list

Maintain accurate counts.

Prevent duplicate relationships.

Use proper database constraints.

Design the system to scale.



16. DISCOVERY

Create a discovery/search experience.

Users should eventually be able to discover:

People

Usernames

Moments

Topics

Popular moments

Emerging moments

The first version can keep recommendation logic relatively simple.

However, structure the backend so recommendation algorithms can become more sophisticated later.

Potential future signals:

Watch time

Completion rate

Likes

Comments

Shares

Saves

Follows

Rewatches

User interests

Location/context where privacy allows



17. NOTIFICATIONS

Implement a notification foundation.

Users should receive notifications for appropriate events such as:

New follower

Like

Comment

Comment reply

Mention

Other important interactions

Create a notification system that can later support:

Push notifications

Email notifications

Notification preferences

Do not spam users.



18. PRIVACY

Privacy must be treated as a first-class product feature.

Users should have appropriate controls for:

Public/private account

Who can follow them

Who can comment

Who can interact with them

Blocking

Muting

Reporting

Discoverability

Notification preferences

Do not expose unnecessary personal information.

Build with privacy by design.



19. SAFETY AND MODERATION

A serious social platform requires a real safety foundation.

Implement reporting for:

Users

Moments

Comments

Report categories can include:

Harassment

Bullying

Hate

Sexual content

Violence

Dangerous behavior

Spam

Impersonation

Illegal content

Self-harm related content

Other

Implement:

Block user

Content removal workflow

Moderation status

Admin moderation tools

Report queue

Basic rate limiting

Abuse prevention

Audit logging where appropriate

Create an admin/moderator area that allows authorized staff to:

View reported content

Review reports

Remove content

Suspend accounts

Ban accounts

Review users

See moderation history

Never expose admin functionality to normal users.



20. LEGAL / POLICY FOUNDATION

Because Reelzy is intended to become a real social platform, create the necessary policy architecture.

The product should have dedicated pages/flows for:

Terms of Service

Privacy Policy

Community Guidelines

Safety Guidelines

Cookie Policy where applicable

Copyright/IP policy

Reporting policy

Account deletion

Data/privacy requests where applicable

Age requirements

Users should explicitly agree to the relevant terms during registration.

Do not pretend that generic placeholder policies are legally sufficient.

The architecture should make it easy to replace initial policy text with lawyer-reviewed policies before public launch.

Reelzy should be designed with applicable privacy and platform regulations in mind, including GDPR where applicable and children’s privacy requirements relevant to the markets in which Reelzy operates.

Do not claim legal compliance unless it has actually been reviewed and verified.



21. ACCOUNT MANAGEMENT

Users should be able to:

Edit profile

Change username

Change password

Manage email

Manage privacy

Manage notifications

Blocked users

Download/request their data where applicable

Delete account

Account deletion should be a real backend operation, not simply hiding the profile.

Define an appropriate deletion/deactivation lifecycle.



22. CONTENT MANAGEMENT

Users should be able to manage their own moments.

Include:

Delete moment

Hide/unpublish where appropriate

Save

View analytics appropriate to the user

Report content

Share content

Content deletion should properly handle associated media and database relationships according to the retention policy.



23. SECURITY

Treat security seriously.

Implement:

Server-side authorization

Database row-level access controls where supported

Secure authentication

Secure media access

Signed/private media URLs where appropriate

Rate limiting

Input validation

File/media validation

Abuse prevention

CSRF protection where applicable

Secure API design

Environment variables for secrets

No secrets exposed in frontend code

Audit logging for sensitive administrative actions

Never trust user-provided IDs or frontend permissions.



24. DATABASE ARCHITECTURE

Use a proper relational database architecture.

At minimum, model entities such as:

Users

Profiles

Follows

Moments

Media

Likes

Comments

Saves

Views

Reports

Blocks

Notifications

Moderation actions

User settings

Privacy settings

Terms/policy acceptance

Use proper:

Primary keys

Foreign keys

Unique constraints

Indexes

Timestamps

Soft deletion where appropriate

Referential integrity

Design the schema so future functionality can be added without major restructuring.



25. MEDIA STORAGE

Do not store large video files directly inside ordinary database records.

Use appropriate object/media storage architecture.

Design for:

Video upload/storage

Processing

Compression/transcoding

Multiple resolutions

Thumbnails

Streaming-friendly delivery

CDN integration later

Media deletion

Access control

The exact infrastructure can be selected based on the technology stack.



26. PERFORMANCE

The feed must feel extremely fast.

Prioritize:

Fast initial loading

Lazy loading

Video preloading intelligently

Efficient thumbnails

Pagination/infinite scrolling

Caching

Optimized media delivery

Error recovery

Offline-friendly states where appropriate

Avoid downloading multiple full-resolution videos unnecessarily.



27. RESPONSIVE EXPERIENCE

Design the product primarily around mobile use.

The experience should work beautifully on:

iPhone

Android

Modern mobile browsers where applicable

Desktop web for browsing/admin functionality where appropriate

However, do not compromise the core mobile camera experience.

The eventual native mobile application should be able to provide the strongest Reelzy camera experience.



28. DESIGN SYSTEM

Create a complete Reelzy design system rather than styling individual pages independently.

Define:

Typography

Font hierarchy

Spacing system

Border radius

Buttons

Cards

Inputs

Navigation

Icons

Video controls

Profile elements

Counters

Tags

Notifications

Modals

Bottom sheets

Empty states

Loading states

Error states

The design language should feel unmistakably Reelzy.

Do not use visual conventions simply because they are common in other social apps.



29. BRAND DIRECTION

Brand:

REELZY

Tagline:

Real moments.

Brand personality:

Human

Confident

Curious

Playful

Honest

Energetic

Slightly unpredictable

Social

Contemporary

Avoid making the brand feel:

Corporate

Clinical

Luxury-fashion

Generic startup

AI-focused

Overly futuristic

Childish

Reelzy should feel like a platform people genuinely want to belong to.



30. NAVIGATION

Do not automatically use the conventional five-tab social-media navigation.

Explore a more original structure.

However, users must still be able to quickly reach:

Feed

Discovery

Camera

Notifications/activity

Profile

The camera should feel central to the product.

Navigation should be simple enough that a first-time user understands it immediately.



31. ONBOARDING

Create an exciting onboarding experience.

The first experience should communicate:

“Reelzy shows real life.”

The user should quickly understand:

What Reelzy is

Why it is different

That content comes from the Reelzy camera

That there is no camera-roll uploading

How to follow people

How to discover moments

Do not make onboarding unnecessarily long.

Get the user into the experience quickly.



32. EMPTY STATES

Create beautiful, intentional empty states.

Examples:

No followers:

“Your people haven’t found you yet.”

No following:

“Find some real life.”

No saved moments:

“Keep the moments you don’t want to lose.”

No notifications:

“Nothing happening… yet.”

Make empty states feel like part of Reelzy rather than generic SaaS placeholders.



33. MICROINTERACTIONS

Use subtle, premium animation.

Examples:

Moment capture animation

Camera shutter

Post publishing animation

Follow animation

Like interaction

View counter transitions

Feed transitions

Profile transitions

Bottom-sheet interactions

Notification animations

Animations should communicate personality without becoming distracting.



34. ACCESSIBILITY

Build accessibility into the product.

Support:

Sufficient contrast

Dynamic/responsive typography

Screen readers

Accessible buttons

Keyboard navigation where applicable

Reduced-motion preferences

Captions/subtitles where appropriate

Clear touch targets



35. ANALYTICS FOUNDATION

Create an analytics/event architecture.

Track appropriate product events such as:

App/session start

Registration

Login

Camera opened

Recording started

Recording completed

Moment published

Moment viewed

View completed

Like

Comment

Share

Save

Follow

Unfollow

Search

Report

Block

Account deletion

Do not collect unnecessary personal information.

Make analytics privacy-conscious.



36. ADMIN PLATFORM

Create a secure administrative area.

Admin functionality should include:

User search

User profile

Account status

Content search

Report queue

Moderation

Account suspension

Account banning

Content removal

Moderation history

Basic platform metrics

Use strict role-based access.

Potential roles:

Admin

Moderator

Support

Normal users must never access administrative functions.



37. FUTURE-READY ARCHITECTURE

Do not implement payments now.

But design the system so future modules can be added cleanly.

Future modules may include:

Monetization

Payments

Subscriptions

Creator payouts

Gifts

Tips

Advertising

Social

Direct messages

Groups

Live video

Events

Creator

Creator analytics

Creator dashboard

Monetization dashboard

Professional accounts

Business

Business profiles

Advertising tools

Business analytics

These should be modular additions rather than requiring a complete rewrite.



38. IMPORTANT: REAL PLATFORM, NOT JUST A FRONTEND

Do not spend all effort making beautiful screens while leaving the underlying application as fake/demo data.

Every core action should work.

For example:

If a user taps Follow:

→ database relationship is created.

If a user likes a moment:

→ like is stored.

If a user comments:

→ comment is persisted.

If a user publishes:

→ actual media is stored.

If a user deletes their account:

→ the account lifecycle actually executes.

If a user reports something:

→ a real moderation record is created.

The application should behave like a real product.



39. PLACEHOLDERS ARE OK — FAKE FUNCTIONALITY IS NOT

If an external service cannot yet be fully configured, create a clean integration layer and clearly identify what configuration is required.

Do not silently fake successful operations.

For example:

If push notifications require an external provider, structure the notification service so the provider can be connected later.

If video transcoding requires a dedicated service, create the media-processing abstraction.

If email delivery requires an email provider, create the email service abstraction.

The application should be designed for real integrations.



40. ENVIRONMENT AND DEPLOYMENT

Structure the project for:

Development

Staging

Production

Use environment variables for:

API keys

Database credentials

Storage credentials

Authentication secrets

Third-party integrations

Never hard-code secrets.

Provide clear setup documentation.



41. ERROR HANDLING

Every important user action needs proper states:

Loading

Success

Failure

Retry

Empty

Unauthorized

Offline/network failure

Do not allow the UI to silently fail.

Give users understandable messages.



42. LEGAL AGE / USER SAFETY

Because Reelzy is a 13+ social platform, take child and teen safety seriously.

The architecture should support future age-based policies and controls.

Do not intentionally design features that encourage unsafe contact between adults and minors.

Build strong reporting/blocking/moderation foundations from the beginning.



43. LAUNCH STRATEGY

The first launch should prioritize:

Users + retention + authentic moments.

Do not distract the first release with:

Payments

Complex creator monetization

Cryptocurrency

Marketplace

Excessive gamification

Overly complex editing

Too many account types

The first question should always be:

“Does this make people want to open Reelzy and see what is happening in other people’s real lives?”



44. MOST IMPORTANT DESIGN PRINCIPLE

Reelzy must NOT feel like:

“Another place to perform for the internet.”

It should feel like:

“A window into what people are actually doing right now.”

The interface should support spontaneity.

It should encourage people to capture moments rather than manufacture content.

The camera is not just a feature.

The camera is part of the identity of Reelzy.



45. IMPLEMENTATION PRIORITY

Build in this order:

Phase 1 — Foundation

Project architecture

Database

Authentication

User accounts

Security

Policies

Age gate

Profile system

Phase 2 — Core Reelzy experience

Camera

Capture

Limited editing

Media storage

Publishing

Feed

Following

Discovery

Phase 3 — Social

Likes

Comments

Shares

Saves

Views

Notifications

Search

Profiles

Phase 4 — Safety

Reporting

Blocking

Moderation

Admin dashboard

Account management

Privacy controls

Phase 5 — Production hardening

Performance

Rate limiting

Monitoring

Error handling

Analytics

Security review

Data management

Deployment

Phase 6 — Future expansion

Only after the core product has users and meaningful usage should we add:

Payments

Creator monetization

Advertising

Messaging

Live

Business accounts

Advanced creator tools



FINAL INSTRUCTION TO LOVABLE

Be ambitious with the product design.

Do not create a generic social-media template.

Do not copy existing social networks.

Do not simply make TikTok prettier.

Invent a visual and interaction system that feels native to Reelzy.

At the same time, do not sacrifice usability for novelty.

The final product should feel like something that could realistically become a major global social platform.

REELZY

Real moments.

REAL LIFE. REAL PEOPLE. REAL MOMENTS.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://reelzymoment.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9a8ef755-bcf0-4b70-b84e-294a7beaa749).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
