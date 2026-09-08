/**
 * Whole-app interface translation.
 *
 * Every visible piece of interface text is collected from the page and shown in
 * the chosen language. Translations are fetched once, cached in the browser and
 * on the server, and reused instantly afterwards.
 *
 * Important: anything already known is applied *synchronously*, in the same
 * frame the text appears. Screens re-render constantly (feed, counters, tabs),
 * and any delay there makes text visibly flip between languages.
 *
 * Anything marked with `data-no-translate` is left exactly as written — that is
 * where people's own content lives (posts, names, messages).
 */
import { translateUi } from "./translate.functions";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "SVG", "PATH"]);
const ATTRS = ["placeholder", "aria-label", "title", "alt"] as const;
const HAS_LETTER = /\p{L}{2,}/u;
const MAX_LEN = 300;
const BATCH = 60;

type Job = { apply: (value: string) => void };

function cacheKey(locale: string) {
  return `goheet.tr.${locale}`;
}

function loadCache(locale: string): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(cacheKey(locale));
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveCache(locale: string, cache: Record<string, string>) {
  try {
    window.localStorage.setItem(cacheKey(locale), JSON.stringify(cache));
  } catch {
    /* storage full or blocked — translations simply refetch next time */
  }
}

// Brand words and the official brand line always stay exactly as written.
const BRAND = /^(goheet|go\s*heet|heet|heets|reelz|reelzy|go)$/i;

function translatable(text: string) {
  const trimmed = text.trim();
  if (BRAND.test(trimmed)) return false;
  return trimmed.length > 0 && trimmed.length <= MAX_LEN && HAS_LETTER.test(trimmed);
}

function skipped(node: Node | null): boolean {
  let el: Element | null =
    node && node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element | null);
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.hasAttribute?.("data-no-translate")) return true;
    if (el.getAttribute?.("translate") === "no") return true;
    if ((el as HTMLElement).isContentEditable) return true;
    el = el.parentElement;
  }
  return false;
}

export function startAutoTranslate(locale: string): () => void {
  const englishMode = locale === "en";

  // Original English text per node, so switching language again works.
  const originalsText = new WeakMap<Text, string>();
  const originalsAttr = new WeakMap<Element, Record<string, string>>();
  // What we last wrote, so re-scans recognise our own output instantly.
  const written = new WeakMap<Text, string>();

  const cache = loadCache(locale);
  const reverse = new Map<string, string>();
  for (const [source, value] of Object.entries(cache)) reverse.set(value, source);

  const pending = new Set<string>();
  const jobs = new Map<string, Job[]>();
  let applying = false;
  let stopped = false;
  let fetchTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleFetch() {
    if (stopped || englishMode || pending.size === 0) return;
    if (fetchTimer) return;
    fetchTimer = setTimeout(() => {
      fetchTimer = null;
      void flush();
    }, 150);
  }

  function queue(source: string, apply: (value: string) => void) {
    const hit = cache[source];
    if (hit) {
      applying = true;
      apply(hit);
      applying = false;
      return;
    }
    const list = jobs.get(source) ?? [];
    list.push({ apply });
    jobs.set(source, list);
    pending.add(source);
    scheduleFetch();
  }

  function handleText(textNode: Text) {
    const current = textNode.nodeValue ?? "";
    // Text we wrote ourselves — nothing to do.
    if (written.get(textNode) === current) return;

    // Recover the English source: remembered, or reverse-looked-up when React
    // handed us a fresh node that already contains a translation.
    let original = originalsText.get(textNode);
    if (original === undefined) {
      const back = reverse.get(current.trim());
      original = back ? current.replace(current.trim(), back) : current;
    }

    if (!translatable(original) || skipped(textNode)) return;

    if (englishMode) {
      if (textNode.nodeValue !== original) {
        applying = true;
        textNode.nodeValue = original;
        applying = false;
      }
      return;
    }

    originalsText.set(textNode, original);
    const leading = original.match(/^\s*/)?.[0] ?? "";
    const trailing = original.match(/\s*$/)?.[0] ?? "";
    queue(original.trim(), (value) => {
      const next = leading + value + trailing;
      if (textNode.nodeValue === next) return;
      textNode.nodeValue = next;
      written.set(textNode, next);
    });
  }

  function handleElement(el: Element) {
    if (skipped(el)) return;
    for (const attr of ATTRS) {
      const stored = originalsAttr.get(el)?.[attr];
      const currentValue = el.getAttribute(attr);
      if (currentValue === null) continue;
      const original = stored ?? reverse.get(currentValue.trim()) ?? currentValue;
      if (!translatable(original)) continue;
      if (englishMode) {
        if (stored && currentValue !== stored) {
          applying = true;
          el.setAttribute(attr, stored);
          applying = false;
        }
        continue;
      }
      originalsAttr.set(el, { ...(originalsAttr.get(el) ?? {}), [attr]: original });
      queue(original.trim(), (value) => {
        if (el.getAttribute(attr) !== value) el.setAttribute(attr, value);
      });
    }
  }

  function scan(root: Node) {
    if (root.nodeType === Node.TEXT_NODE) {
      handleText(root as Text);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) handleElement(root as Element);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let current = walker.nextNode();
    while (current) {
      if (current.nodeType === Node.TEXT_NODE) handleText(current as Text);
      else handleElement(current as Element);
      current = walker.nextNode();
    }
  }

  async function flush() {
    if (stopped || englishMode || pending.size === 0) return;
    const batch = Array.from(pending).slice(0, BATCH);
    for (const text of batch) pending.delete(text);

    let translations: Record<string, string> = {};
    try {
      const res = await translateUi({ data: { locale, texts: batch } });
      translations = res.translations ?? {};
    } catch {
      // Offline or rate limited — English stays visible, we retry on next scan.
      return;
    }
    if (stopped) return;

    applying = true;
    for (const [source, value] of Object.entries(translations)) {
      cache[source] = value;
      reverse.set(value, source);
      for (const job of jobs.get(source) ?? []) {
        try {
          job.apply(value);
        } catch {
          /* node detached */
        }
      }
      jobs.delete(source);
    }
    applying = false;
    saveCache(locale, cache);

    if (pending.size > 0) void flush();
  }

  // Applied immediately, in the same frame the DOM changes, so cached text
  // never flashes back to English between renders.
  const observer = new MutationObserver((records) => {
    if (applying) return;
    applying = true;
    for (const record of records) {
      if (record.type === "characterData") {
        handleText(record.target as Text);
      } else if (record.type === "attributes") {
        handleElement(record.target as Element);
      } else {
        for (const node of Array.from(record.addedNodes)) scan(node);
      }
    }
    applying = false;
    scheduleFetch();
  });

  applying = true;
  scan(document.body);
  applying = false;
  void flush();

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRS],
  });

  return () => {
    stopped = true;
    if (fetchTimer) clearTimeout(fetchTimer);
    observer.disconnect();
  };
}
