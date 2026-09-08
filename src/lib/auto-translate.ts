/**
 * Whole-app interface translation.
 *
 * Every visible piece of interface text is collected from the page and shown in
 * the chosen language. Translations are fetched once, cached in the browser and
 * on the server, and reused instantly afterwards.
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

type Job = { apply: (value: string) => void; original: string };

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

function translatable(text: string) {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_LEN && HAS_LETTER.test(trimmed);
}

function skipped(node: Node | null): boolean {
  let el: Element | null =
    node && node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element | null);
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.hasAttribute?.("data-no-translate")) return true;
    if (el.getAttribute?.("translate") === "no") return true;
    if (el.isContentEditable) return true;
    el = el.parentElement;
  }
  return false;
}

export function startAutoTranslate(locale: string): () => void {
  // Original English text per node, so switching language again works.
  const originalsText = new WeakMap<Text, string>();
  const originalsAttr = new WeakMap<Element, Record<string, string>>();
  const cache = loadCache(locale);
  const pending = new Set<string>();
  const jobs = new Map<string, Job[]>();
  let applying = false;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const englishMode = locale === "en";

  function queue(original: string, apply: (value: string) => void) {
    const hit = cache[original];
    if (hit) {
      applying = true;
      apply(hit);
      applying = false;
      return;
    }
    const list = jobs.get(original) ?? [];
    list.push({ apply, original });
    jobs.set(original, list);
    pending.add(original);
  }

  function scan(root: Node) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    const nodes: Node[] = [];
    if (root.nodeType === Node.TEXT_NODE || root.nodeType === Node.ELEMENT_NODE) nodes.push(root);
    let current = walker.nextNode();
    while (current) {
      nodes.push(current);
      current = walker.nextNode();
    }

    for (const node of nodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text;
        const original = originalsText.get(textNode) ?? textNode.nodeValue ?? "";
        if (!translatable(original) || skipped(textNode)) continue;
        if (englishMode) {
          if (originalsText.has(textNode) && textNode.nodeValue !== original) {
            applying = true;
            textNode.nodeValue = original;
            applying = false;
          }
          continue;
        }
        originalsText.set(textNode, original);
        const leading = original.match(/^\s*/)?.[0] ?? "";
        const trailing = original.match(/\s*$/)?.[0] ?? "";
        queue(original.trim(), (value) => {
          textNode.nodeValue = leading + value + trailing;
        });
        continue;
      }

      const el = node as Element;
      if (skipped(el)) continue;
      for (const attr of ATTRS) {
        const stored = originalsAttr.get(el)?.[attr];
        const original = stored ?? el.getAttribute(attr) ?? "";
        if (!translatable(original)) continue;
        if (englishMode) {
          if (stored && el.getAttribute(attr) !== stored) {
            applying = true;
            el.setAttribute(attr, stored);
            applying = false;
          }
          continue;
        }
        originalsAttr.set(el, { ...(originalsAttr.get(el) ?? {}), [attr]: original });
        queue(original.trim(), (value) => el.setAttribute(attr, value));
      }
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

  function run() {
    if (stopped) return;
    applying = true;
    scan(document.body);
    applying = false;
    void flush();
  }

  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(run, 200);
  };

  const observer = new MutationObserver((records) => {
    if (applying) return;
    for (const record of records) {
      if (record.type === "characterData" || record.addedNodes.length > 0) {
        schedule();
        return;
      }
      if (record.type === "attributes") {
        schedule();
        return;
      }
    }
  });

  run();
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRS],
  });

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    observer.disconnect();
  };
}
