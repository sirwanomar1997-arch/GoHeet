/**
 * Objectionable-text filter.
 *
 * App Store Review Guideline 1.2 requires user-generated content platforms to
 * have "a method for filtering objectionable material from being posted".
 * This is that first line of defence: text that clearly violates the
 * Community Guidelines is rejected before it is ever stored, so it never
 * reaches another person's screen. Reporting, blocking and the moderation
 * queue handle everything that a word list cannot catch.
 */

// Patterns are deliberately narrow: unambiguous slurs, sexualised-minor terms
// and explicit threats. Ordinary profanity is not blocked — it is allowed and
// handled by reporting, so normal speech is not censored.
const BLOCKED_PATTERNS: RegExp[] = [
  // sexualisation of minors — zero tolerance
  /\b(child|kid|kiddie|minor|preteen|pre-?teen|underage|under-?age|loli|shota)\s*(porn|pornography|nudes?|nude|sex|sexy|xxx|cp)\b/i,
  /\bc\W?[su]\W?a\W?m\b.*\bchild/i,
  /\bpedo(phile|philia)?\b/i,
  // explicit threats of violence
  /\bi(?:'m| am| will|ll| will be)?\s*(going to\s*)?(kill|murder|stab|shoot|behead|rape)\s+(you|u|him|her|them|your)\b/i,
  /\b(kill|kys)\s*your\s*self\b/i,
  /\bkys\b/i,
  // dehumanising slurs
  /\bn[i1!][g6]{2}[e3]r\b/i,
  /\bn[i1!][g6]{2}a[sz]?\b/i,
  /\bf[a@][g6]{1,2}([o0]t)?s?\b/i,
  /\bk[i1]ke\b/i,
  /\bch[i1]nk\b/i,
  /\bsp[i1]c\b/i,
  /\btr[a@]nn(y|ie)\b/i,
  /\br[e3]t[a@]rd(ed|s)?\b/i,
  // terrorism / mass-violence promotion
  /\b(join|support|glory to)\s+(isis|daesh|al[- ]?qaeda)\b/i,
];

export const SAFETY_REJECTION =
  "That breaks the GoHeet Community Guidelines, so it was not posted. Hate speech, threats and anything sexualising minors are never allowed.";

export function isObjectionableText(input: string | null | undefined): boolean {
  if (!input) return false;
  // Normalise common obfuscation (zero-width chars, repeated separators).
  const normalised = input
    .normalize("NFKD")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[._\-*+]/g, "");
  return BLOCKED_PATTERNS.some((re) => re.test(input) || re.test(normalised));
}

/** Throws when the text is objectionable; otherwise returns it unchanged. */
export function assertSafeText<T extends string | null | undefined>(input: T): T {
  if (isObjectionableText(input)) throw new Error(SAFETY_REJECTION);
  return input;
}
