import { createFileRoute, Link, notFound } from "@tanstack/react-router";

type Doc = { title: string; summary: string; sections: Array<{ h: string; p: string[] }> };

const UPDATED = "September 2026";
export const SUPPORT_CHANNEL = "Settings \u2192 Help & support in the app";

const DOCS: Record<string, Doc> = {
  terms: {
    title: "Terms of Service",
    summary: "The rules for using GoHeet. This is also the end user licence agreement (EULA).",
    sections: [
      {
        h: "Agreement",
        p: [
          "By creating an account or using GoHeet you accept these Terms, the Community Guidelines and the zero-tolerance policy below. If you do not accept them, do not use GoHeet.",
        ],
      },
      {
        h: "Zero tolerance for objectionable content and abusive users",
        p: [
          "There is no tolerance for objectionable content or abusive behaviour on GoHeet. This includes hate speech, harassment, threats, sexual content involving minors, graphic violence, and content promoting self-harm or dangerous acts.",
          "Anyone who posts such content, or abuses other people, has their content removed and their account suspended or permanently removed.",
          "Reports are reviewed and acted on within 24 hours. Offending content is removed and the person responsible is ejected from GoHeet.",
        ],
      },
      {
        h: "Who can use GoHeet",
        p: [
          "You must be at least 13 years old to create a GoHeet account. Some regions require a higher minimum age; where that applies, that higher age governs.",
          "You are responsible for the accuracy of the date of birth you give us and for keeping your login credentials secure.",
        ],
      },
      {
        h: "Camera-only capture",
        p: [
          "All content published on GoHeet must be captured through the GoHeet camera during an active capture session. Uploading from a camera roll or another app is not supported, and attempts to bypass capture verification are a breach of these terms.",
          "We validate capture origin on our servers. Content that fails validation is rejected.",
        ],
      },
      {
        h: "Your content",
        p: [
          "You keep ownership of what you capture. You grant GoHeet a licence to host, process and display your content so the service can function.",
          "You can delete your posts or your entire account at any time from Settings.",
        ],
      },
      {
        h: "Acceptable use",
        p: [
          "Do not post illegal content, harass people, impersonate others, or attempt to break, scrape or overload the service.",
          "We may remove content, restrict features, suspend or terminate accounts that break these terms or our Community Guidelines. These decisions are final.",
        ],
      },
      {
        h: "Service and liability",
        p: [
          "GoHeet is provided as-is. We work to keep it available and secure but cannot guarantee uninterrupted service.",
          "Nothing here limits rights you have under mandatory local law.",
        ],
      },
      {
        h: "Contact",
        p: [`Questions about these terms: ${SUPPORT_CHANNEL}.`],
      },
      {
        h: "Changes",
        p: [
          "We will notify you in the app when these terms change materially. Continuing to use GoHeet after a change means you accept the updated terms.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    summary: "What we collect, why, and what you control.",
    sections: [
      {
        h: "What we collect",
        p: [
          "Account data: email address or phone number, username, display name, date of birth, and profile details you add.",
          "Content data: posts you capture, captions, optional place labels, and technical capture metadata used to verify camera origin.",
          "Usage data: heets, saves, comments, follows, qualified views, searches, and product analytics events used to operate and improve GoHeet.",
        ],
      },
      {
        h: "Camera and microphone",
        p: [
          "GoHeet asks for camera and microphone access only so you can record inside the app. Nothing is recorded unless you start a recording, and nothing is read from your photo library.",
        ],
      },
      {
        h: "Why we process it",
        p: [
          "To run your account, deliver your feed, keep the platform safe, enforce the camera-only rule, prevent abuse, and meet legal obligations.",
        ],
      },
      {
        h: "Storage and security",
        p: [
          "Media is stored in private storage and served through short-lived signed links. Database access is protected by row-level security so people can only read what they are permitted to see.",
        ],
      },
      {
        h: "Sharing",
        p: [
          "We do not sell your personal data. We share data with infrastructure providers who host and process it on our behalf, and with authorities where legally required.",
        ],
      },
      {
        h: "Children",
        p: [
          "GoHeet is not intended for anyone under 13. If we learn that an account belongs to someone younger, we remove it.",
        ],
      },
      {
        h: "Your rights",
        p: [
          "You can export your data and permanently delete your account from Settings. Deleting your account removes your profile, posts, media, comments and social graph records.",
          "Depending on where you live, you may have additional rights of access, correction, restriction and objection.",
        ],
      },
      {
        h: "Contact",
        p: [`Privacy questions: ${SUPPORT_CHANNEL}.`],
      },
    ],
  },
  guidelines: {
    title: "Community Guidelines",
    summary: "How to behave on GoHeet.",
    sections: [
      {
        h: "Be real",
        p: [
          "GoHeet exists for real moments. Do not attempt to pass off recycled, re-filmed or artificially generated content as a live capture.",
        ],
      },
      {
        h: "Be decent",
        p: [
          "No harassment, bullying, hate speech, threats or targeted abuse. No sexual content involving minors, ever. No content that promotes self-harm, dangerous challenges or violence.",
        ],
      },
      {
        h: "Respect other people",
        p: [
          "Do not post someone's private information. Do not impersonate people or brands. Consider whether the people in your moment are happy to be there.",
        ],
      },
      {
        h: "What happens when you break the rules",
        p: [
          "Clearly abusive text is blocked automatically before it can be posted.",
          "Everything reported by the community is reviewed within 24 hours. Offending content is removed and the account responsible is suspended or permanently removed.",
          "There is no tolerance for objectionable content or abusive users on GoHeet.",
        ],
      },
    ],
  },
  safety: {
    title: "Safety Centre",
    summary: "Tools for staying in control.",
    sections: [
      {
        h: "Our commitment",
        p: [
          "Reports are triaged and actioned within 24 hours of being filed. Content that breaks the rules is removed and the person who posted it is ejected from GoHeet.",
        ],
      },
      {
        h: "Blocking",
        p: [
          "Blocking someone removes any follow relationship in both directions and hides your content from them and theirs from you. Block from the ••• menu on a profile.",
        ],
      },
      {
        h: "Reporting",
        p: [
          "You can report a post, a comment or a person from the ••• menu on their content. Reports go to a review queue handled by our safety team.",
          "Urgent safety concerns can also be sent through Settings \u2192 Help & support, choosing \"Safety or abuse\". These are actioned within 24 hours.",
        ],
      },
      {
        h: "Automatic filtering",
        p: [
          "Captions, on-screen text and comments are screened for slurs, threats and content sexualising minors, and are rejected before they are posted.",
        ],
      },
      {
        h: "Privacy controls",
        p: [
          "You can make your account private so only approved followers see your posts, turn off discoverability in search, restrict who can comment, and require message requests from people you do not follow.",
        ],
      },
      {
        h: "If someone is in danger",
        p: [
          "If you or someone else is at immediate risk, contact your local emergency services. GoHeet is not an emergency service.",
        ],
      },
    ],
  },
  reporting: {
    title: "Report & Safety Policy",
    summary: "How reporting works on GoHeet and what you can report.",
    sections: [
      {
        h: "How to report",
        p: [
          "Tap the ••• menu on any video, comment or profile and choose Report. You then choose the reason that best matches the problem.",
          "Your report stays anonymous to other users. The person you report is never told who reported them.",
        ],
      },
      {
        h: "What you can report",
        p: [
          "When you report, you can choose from: I just don't like it, Sexual content, Hate and harassment, Violence or abuse, Child safety, False information or AI-generated content, Suicide and self-harm, Undisclosed branded content, and More reasons.",
          "Every category is reviewed against the same Community Guidelines. Child safety reports are treated with the highest priority and handled under our child safety standards.",
        ],
      },
      {
        h: "What happens next",
        p: [
          "Reports are reviewed by the GoHeet safety team within 24 hours. Content that breaks our rules is removed, and accounts that break the rules are suspended or permanently removed.",
          "Content reported as false information or AI-generated is re-checked automatically and removed immediately if it fails our capture verification.",
        ],
      },
      {
        h: "Zero tolerance",
        p: [
          "There is no tolerance for objectionable content or abusive users on GoHeet. This includes sexual content involving minors, hate speech, harassment, graphic violence, and content promoting self-harm or dangerous acts.",
        ],
      },
      {
        h: "If someone is in danger",
        p: [
          "If you or someone else is at immediate risk, contact your local emergency services. GoHeet is not an emergency service.",
        ],
      },
    ],
  },
  support: {
    title: "Support",
    summary: "How to reach a human.",
    sections: [
      {
        h: "Contact us",
        p: [
          "Fastest way: open the app and go to Settings → Help & support. You can write to us there and read our reply inside the app.",
          "Every request goes straight to the GoHeet support team. You give your name and an email address in the form, so we can also answer you by email.",
          "We reply to support mail within two business days, and to safety reports within 24 hours.",
        ],
      },
      {
        h: "Common things you can do yourself",
        p: [
          "Recover a deleted post within 30 days from Settings → Activity → Trash.",
          "Export your data or delete your account from Settings → Account.",
          "Manage blocked people from Settings → Activity → Blocked people.",
        ],
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    summary: "Storage used on your device.",
    sections: [
      {
        h: "Essential storage",
        p: [
          "GoHeet stores your login session on your device so you stay signed in. Without it the service cannot work.",
        ],
      },
      {
        h: "Analytics",
        p: [
          "We record first-party product events (for example: a post published, a camera opened) tied to your account so we can understand and improve how GoHeet is used. We do not run third-party advertising trackers.",
        ],
      },
    ],
  },
  copyright: {
    title: "Copyright",
    summary: "Reporting infringement.",
    sections: [
      {
        h: "Notices",
        p: [
          "If you believe content on GoHeet infringes your copyright, submit a report through the ••• menu on that content, or send us a request from Settings \u2192 Help & support, including enough detail to identify the work and your rights in it.",
          "Copyright notices: Settings \u2192 Help & support, choosing \"Other\".",
        ],
      },
      {
        h: "Repeat infringement",
        p: ["Accounts that repeatedly infringe copyright are terminated."],
      },
    ],
  },
  "child-safety": {
    title: "Child Safety Standards",
    summary:
      "GoHeet's standards and measures against child sexual abuse and exploitation (CSAE).",
    sections: [
      {
        h: "Zero tolerance",
        p: [
          "GoHeet has zero tolerance for child sexual abuse and exploitation (CSAE). This includes any sexual content involving minors, grooming, sexualisation of minors, or content that endangers children. Such content is prohibited and is removed immediately upon detection.",
          "GoHeet is not intended for anyone under 13. If we learn that an account belongs to someone under 13, we remove it.",
        ],
      },
      {
        h: "How we prevent CSAE content",
        p: [
          "All content on GoHeet must be captured through the GoHeet camera during an active capture session; uploads from a camera roll or another app are not supported, and we validate capture origin on our servers.",
          "Captions, on-screen text, comments, display names and bios are screened automatically for sexual content involving minors and other prohibited material, and are blocked before they are posted.",
          "A human moderation team reviews reported content and accounts and acts within 24 hours of a report being filed.",
        ],
      },
      {
        h: "Reporting CSAE content",
        p: [
          "Anyone can report a post, comment or profile from the ••• menu on that content. Reports go to a review queue handled by our safety team.",
          "Urgent child safety concerns can also be sent through Settings \u2192 Help & support, choosing \"Safety or abuse\". These are actioned within 24 hours.",
          "When we become aware of CSAE content, we remove it, suspend or remove the account responsible, and report it to the appropriate authorities, including the National Center for Missing & Exploited Children (NCMEC) CyberTipline where applicable.",
        ],
      },
      {
        h: "Contact",
        p: [
          `For questions about our child safety standards, contact our safety team at ${SUPPORT_CHANNEL}, or email sirwanomar1997@gmail.com. Our safety contact can discuss preventative measures regarding child sexual abuse material and responds to child safety reports within 24 hours.`,
        ],
      },
    ],
  },
};

export const Route = createFileRoute("/legal/$doc")({
  loader: ({ params }) => {
    const doc = DOCS[params.doc];
    if (!doc) throw notFound();
    return { doc };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Unavailable — GoHeet" }, { name: "robots", content: "noindex" }] };
    }
    const t = `${loaderData.doc.title} — GoHeet`;
    return {
      meta: [
        { title: t },
        { name: "description", content: loaderData.doc.summary },
        { property: "og:title", content: t },
        { property: "og:description", content: loaderData.doc.summary },
      ],
    };
  },
  component: LegalPage,
});

function LegalPage() {
  const { doc } = Route.useLoaderData();
  return (
    <main className="min-h-svh bg-background px-6 pb-20 pt-10">
      <div className="mx-auto max-w-lg">
        <Link to="/" className="data-figure text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          ← GoHeet
        </Link>
        <h1 className="mt-6 font-display text-3xl font-extrabold tracking-[-0.04em]">{doc.title}</h1>
        <p className="data-figure mt-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Updated {UPDATED}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">{doc.summary}</p>

        <div className="mt-10 space-y-8">
          {doc.sections.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-lg font-semibold">{s.h}</h2>
              {s.p.map((para) => (
                <p key={para} className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>

        <nav className="mt-14 flex flex-wrap gap-2 border-t border-border pt-6">
          {Object.entries(DOCS).map(([key, d]) => (
            <Link
              key={key}
              to="/legal/$doc"
              params={{ doc: key }}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground"
            >
              {d.title}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
