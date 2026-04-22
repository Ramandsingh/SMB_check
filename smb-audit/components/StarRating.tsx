'use client'

interface Props {
  value: number | null
  onChange: (v: number | null) => void
}

export function StarRating({ value, onChange }: Props) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? null : n)}
          className="focus:outline-none"
          aria-label={`Rate ${n}`}
        >
          <svg
            className={`w-7 h-7 transition-colors ${
              value !== null && n <= value
                ? 'text-amber-400'
                : 'text-gray-200 hover:text-amber-200'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
      {value !== null && (
        <span className="ml-1 text-sm text-gray-500 self-center">{value}/5</span>
      )}
    </div>
  )
}
