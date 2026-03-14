import { useState, useEffect, useRef, useCallback } from 'react';
import { RiMapPinLine, RiLoader4Line } from 'react-icons/ri';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AddressSearch({ value, onChange, onLocationSelect, placeholder }) {
  const [query, setQuery] = useState(value ?? '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const debouncedQuery = useDebounce(query, 400);

  // Propagate external value changes (e.g. form reset)
  useEffect(() => { setQuery(value ?? ''); }, [value]);

  // Fetch from Nominatim when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedQuery)}&format=json&limit=6&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setResults(data);
          setOpen(data.length > 0);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSelect(result) {
    const address = result.display_name;
    setQuery(address);
    setOpen(false);
    onChange(address);
    onLocationSelect({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });
  }

  function handleChange(e) {
    setQuery(e.target.value);
    onChange(e.target.value);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <RiMapPinLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
        {loading && (
          <RiLoader4Line className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base animate-spin" />
        )}
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder ?? 'Search address…'}
          className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
        />
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <li
              key={r.place_id ?? i}
              onMouseDown={() => handleSelect(r)}
              className="flex items-start gap-2.5 px-4 py-3 text-sm cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
            >
              <RiMapPinLine className="text-slate-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700 leading-snug line-clamp-2">{r.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
