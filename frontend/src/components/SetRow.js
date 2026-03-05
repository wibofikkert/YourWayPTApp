import React from 'react'

export default function SetRow({ setNumber, values, onChange, onRemove, canRemove }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Set number badge */}
      <span className="w-6 sm:w-7 text-xs text-dark-muted text-center font-semibold flex-shrink-0">{setNumber}</span>

      {/* Reps, weight, RPE inputs */}
      <div className="flex-1 grid grid-cols-3 gap-1 sm:gap-2">
        <div>
          {setNumber === 1 && <label className="block text-xs text-dark-muted font-medium mb-1">Reps</label>}
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={values.reps}
            onChange={e => onChange({ ...values, reps: parseInt(e.target.value) || 1 })}
            className="input text-center px-1 sm:px-2 text-sm"
          />
        </div>
        <div>
          {setNumber === 1 && <label className="block text-xs text-dark-muted font-medium mb-1">Gewicht (kg)</label>}
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            value={values.weight_kg}
            onChange={e => onChange({ ...values, weight_kg: parseFloat(e.target.value) || 0 })}
            className="input text-center px-1 sm:px-2 text-sm"
          />
        </div>
        <div>
          {setNumber === 1 && <label className="block text-xs text-dark-muted font-medium mb-1">RPE</label>}
          <input
            type="number"
            inputMode="numeric"
            min="1"
            max="10"
            placeholder="—"
            value={values.rpe || ''}
            onChange={e => onChange({ ...values, rpe: e.target.value ? parseInt(e.target.value) : null })}
            className="input text-center px-1 sm:px-2 text-sm"
          />
        </div>
      </div>

      {/* Remove button — proper touch target */}
      <button
        onClick={onRemove}
        disabled={!canRemove}
        className="flex items-center justify-center min-h-[44px] min-w-[36px] text-dark-subtle hover:text-red-500 transition-colors disabled:opacity-0 flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
