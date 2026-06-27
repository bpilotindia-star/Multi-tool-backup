import { useMemo } from 'react';
import './FPSControl.css';

export default function FPSControl({ fps, onFpsChange, totalFrames, onExtract, isExtracting, disabled }) {
  const presets = useMemo(() => [1, 5, 10, 15, 24, 30], []);

  return (
    <div className="fc" id="fps-control">
      <div className="fc__head">
        <span className="fc__label">Settings</span>
      </div>

      <div className="fc__body">
        {/* FPS value */}
        <div className="fc__value-row">
          <span className="fc__value">{fps}</span>
          <span className="fc__unit">frames / second</span>
        </div>

        {/* Presets */}
        <div className="fc__presets">
          {presets.map((v) => (
            <button
              key={v}
              className={`fc__preset ${fps === v ? 'fc__preset--on' : ''}`}
              onClick={() => onFpsChange(v)}
              disabled={isExtracting}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Slider */}
        <div className="fc__slider-wrap">
          <input
            type="range"
            id="fps-slider"
            min="1"
            max="60"
            step="1"
            value={fps}
            onChange={(e) => onFpsChange(Number(e.target.value))}
            disabled={isExtracting || disabled}
            className="fc__slider"
          />
          <div className="fc__slider-ticks">
            <span>1</span>
            <span>30</span>
            <span>60</span>
          </div>
        </div>

        {/* Estimate */}
        <div className="fc__estimate">
          <span className="fc__est-label">Total frames</span>
          <span className="fc__est-value">{totalFrames.toLocaleString()}</span>
        </div>

        {/* Button */}
        <button
          className="fc__btn"
          onClick={onExtract}
          disabled={isExtracting || disabled}
          id="extract-button"
        >
          {isExtracting ? (
            <>
              <svg className="fc__spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Extracting…
            </>
          ) : (
            'Extract Frames'
          )}
        </button>
      </div>
    </div>
  );
}
