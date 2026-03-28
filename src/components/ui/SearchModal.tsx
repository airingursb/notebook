import { useState, useEffect, useRef, useCallback } from 'react';

interface SearchResult {
  url: string;
  meta: { title?: string };
  excerpt: string;
  sub_results?: { url: string; title: string; excerpt: string }[];
}

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pagefind, setPagefind] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || pagefind) return;
    (async () => {
      try {
        const pf = await import(/* @vite-ignore */ '/notebook/pagefind/pagefind.js');
        await pf.init();
        setPagefind(pf);
      } catch {
        console.warn('Pagefind not available (run a build first)');
      }
    })();
  }, [open, pagefind]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setQuery('');
      setResults([]);
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (!pagefind || q.length < 2) {
      setResults([]);
      return;
    }
    const resp = await pagefind.search(q);
    const data = await Promise.all(resp.results.slice(0, 8).map((r: any) => r.data()));
    setResults(data);
    setActiveIndex(0);
  }, [pagefind]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      window.location.href = results[activeIndex].url;
    }
  };

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={() => setOpen(false)}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-input-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            value={query}
            onChange={e => search(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索笔记…"
          />
          <kbd className="search-kbd">ESC</kbd>
        </div>

        {results.length > 0 && (
          <div className="search-results">
            <div className="search-section-title">笔记 · {results.length} 个结果</div>
            {results.map((r, i) => (
              <a
                key={r.url}
                href={r.url}
                className={`search-result ${i === activeIndex ? 'active' : ''}`}
              >
                <div className="search-result-body">
                  <div className="search-result-title">{r.meta?.title || 'Untitled'}</div>
                  <div
                    className="search-result-snippet"
                    dangerouslySetInnerHTML={{ __html: r.excerpt }}
                  />
                </div>
              </a>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <div className="search-empty">无匹配结果</div>
        )}

        <div className="search-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> 导航</span>
          <span><kbd>↵</kbd> 打开</span>
          <span><kbd>ESC</kbd> 关闭</span>
        </div>
      </div>
    </div>
  );
}
