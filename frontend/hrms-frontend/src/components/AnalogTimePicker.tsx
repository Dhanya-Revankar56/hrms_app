// src/components/AnalogTimePicker.tsx
import React, { useState, useEffect, useRef } from "react";

interface AnalogTimePickerProps {
  initialTime?: string; // "HH:mm" (24h)
  onSave: (time: string) => void;
  onCancel: () => void;
}

export default function AnalogTimePicker({ initialTime, onSave, onCancel }: AnalogTimePickerProps) {
  const parseInitialTime = (time?: string) => {
    if (!time) return { h: 9, m: 0, ampm: "AM" as const };
    const [h, m] = time.split(":").map(Number);
    return {
      h: h % 12 || 12,
      m: m || 0,
      ampm: (h >= 12 ? "PM" : "AM") as "AM" | "PM"
    };
  };

  const [mode, setMode] = useState<"hours" | "minutes">("hours");
  const [ampm, setAmPm] = useState<"AM" | "PM">(() => parseInitialTime(initialTime).ampm);
  const [hours, setHours] = useState(() => parseInitialTime(initialTime).h);
  const [minutes, setMinutes] = useState(() => parseInitialTime(initialTime).m);
  const [isDragging, setIsDragging] = useState(false);
  const clockRef = useRef<HTMLDivElement>(null);

  const [prevInitialTime, setPrevInitialTime] = useState(initialTime);

  if (initialTime !== prevInitialTime) {
    const { h, m, ampm: a } = parseInitialTime(initialTime);
    setAmPm(a);
    setHours(h);
    setMinutes(m);
    setMode("hours");
    setPrevInitialTime(initialTime);
  }


  const calculateTimeFromEvent = React.useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    let mx, my;
    if ("touches" in e && e.touches.length > 0) {
      mx = e.touches[0].clientX;
      my = e.touches[0].clientY;
    } else {
      const mouseEvent = e as unknown as MouseEvent | React.MouseEvent;
      mx = mouseEvent.clientX;
      my = mouseEvent.clientY;
    }

    const dx = mx - cx;
    const dy = my - cy;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;

    if (mode === "hours") {
      const h = Math.round(angle / 30) % 12 || 12;
      setHours(h);
    } else {
      const m = Math.round(angle / 6) % 60;
      setMinutes(m);
    }
  }, [mode]);

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    calculateTimeFromEvent(e);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    calculateTimeFromEvent(e);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => isDragging && calculateTimeFromEvent(e);
    const onTouchMove = (e: TouchEvent) => isDragging && calculateTimeFromEvent(e);
    const onMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (mode === "hours") setMode("minutes");
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);
    };
  }, [isDragging, mode, calculateTimeFromEvent]);

  const handleSave = React.useCallback(() => {
    let h24 = hours % 12;
    if (ampm === "PM") h24 += 12;
    const result = `${String(h24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    onSave(result);
  }, [hours, minutes, ampm, onSave]);

  const hourAngle = (hours % 12) * 30;
  const minuteAngle = minutes * 6;
  const currentAngle = mode === "hours" ? hourAngle : minuteAngle;

  return (
    <div className="atp-overlay" onClick={onCancel}>
      <style>{`
        .atp-overlay { 
          position: fixed; inset: 0; background: rgba(0,0,0,0.4); 
          display: flex; align-items: center; justify-content: center; z-index: 2000; 
          backdrop-filter: blur(2px);
        }
        .atp-modal { 
          background: #fff; border-radius: 12px; width: 310px; overflow: hidden; 
          box-shadow: 0 10px 25px rgba(0,0,0,0.15); animation: atpIn 0.2s ease-out;
        }
        @keyframes atpIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        
        .atp-header { 
          background: #3f51b5; color: #fff; padding: 20px 24px; 
          display: flex; flex-direction: column; gap: 4px;
        }
        .atp-header-time { display: flex; align-items: baseline; font-family: 'DM Sans', sans-serif; }
        .atp-time-val { font-size: 48px; font-weight: 500; cursor: pointer; opacity: 0.7; transition: 0.2s; }
        .atp-time-val.active { opacity: 1; }
        .atp-time-sep { font-size: 48px; font-weight: 400; margin: 0 4px; opacity: 0.7; }
        .atp-ampm { display: flex; flex-direction: column; margin-left: 12px; gap: 4px; }
        .atp-ampm-btn { 
          font-size: 16px; font-weight: 700; cursor: pointer; opacity: 0.5; transition: 0.2s; 
          border: none; background: none; color: inherit; padding: 0; text-align: left;
        }
        .atp-ampm-btn.active { opacity: 1; }

        .atp-body { padding: 24px 20px; display: flex; justify-content: center; background: #fdfdfd; }
        .atp-clock { 
          width: 230px; height: 230px; background: #eee; border-radius: 50%; 
          position: relative; cursor: crosshair; touch-action: none;
        }
        .atp-clock-center { 
          position: absolute; top: 50%; left: 50%; width: 6px; height: 6px; 
          background: #3f51b5; border-radius: 50%; transform: translate(-50%, -50%); z-index: 5;
        }
        .atp-hand { 
          position: absolute; top: 50%; left: 50%; height: 2px; background: #3f51b5; 
          transform-origin: left center; z-index: 4; transition: transform 0.1s ease-out;
        }
        .atp-hand-tip { 
          position: absolute; top: 50%; right: -16px; width: 32px; height: 32px; 
          background: #3f51b5; border-radius: 50%; transform: translateY(-50%); 
        }
        .atp-hand-dot { 
          position: absolute; top: 50%; right: -2px; width: 4px; height: 4px; 
          background: #fff; border-radius: 50%; transform: translateY(-50%); z-index: 6;
        }
        
        .atp-number { 
          position: absolute; font-family: 'DM Sans', sans-serif; font-size: 14px; 
          font-weight: 500; color: #555; width: 30px; height: 30px; 
          display: flex; align-items: center; justify-content: center; pointer-events: none;
        }
        .atp-number.active { color: #fff; z-index: 10; font-weight: 700; }

        .atp-footer { padding: 8px 16px 12px; display: flex; justify-content: flex-end; gap: 8px; }
        .atp-btn { 
          border: none; background: none; padding: 8px 12px; border-radius: 4px; 
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; 
          color: #3f51b5; cursor: pointer; transition: 0.2s;
        }
        .atp-btn:hover { background: rgba(63, 81, 181, 0.08); }
      `}</style>
      
      <div className="atp-modal" onClick={e => e.stopPropagation()}>
        <div className="atp-header">
          <div className="atp-header-time">
            <span className={`atp-time-val ${mode === "hours" ? "active" : ""}`} onClick={() => setMode("hours")}>
              {hours}
            </span>
            <span className="atp-time-sep">:</span>
            <span className={`atp-time-val ${mode === "minutes" ? "active" : ""}`} onClick={() => setMode("minutes")}>
              {String(minutes).padStart(2, "0")}
            </span>
            <div className="atp-ampm">
              <button className={`atp-ampm-btn ${ampm === "AM" ? "active" : ""}`} onClick={() => setAmPm("AM")}>AM</button>
              <button className={`atp-ampm-btn ${ampm === "PM" ? "active" : ""}`} onClick={() => setAmPm("PM")}>PM</button>
            </div>
          </div>
        </div>

        <div className="atp-body">
          <div className="atp-clock" ref={clockRef} onMouseDown={onMouseDown} onTouchStart={onTouchStart}>
            <div className="atp-clock-center" />
            
            {/* Hand */}
            <div className="atp-hand" style={{ width: 90, transform: `translate(0, -50%) rotate(${currentAngle - 90}deg)` }}>
              <div className="atp-hand-tip" />
              {mode === "minutes" && minutes % 5 !== 0 && <div className="atp-hand-dot" />}
            </div>

            {/* Numbers */}
            {(mode === "hours" ? [12,1,2,3,4,5,6,7,8,9,10,11] : [0,5,10,15,20,25,30,35,40,45,50,55]).map((n, i) => {
              const angle = (i * 30) - 90;
              const rad = (angle * Math.PI) / 180;
              const r = 90;
              const x = 115 + r * Math.cos(rad);
              const y = 115 + r * Math.sin(rad);
              const isActive = (mode === "hours" ? hours === n : minutes === n);
              return (
                <div key={n} className={`atp-number ${isActive ? "active" : ""}`} style={{ left: x - 15, top: y - 15 }}>
                  {mode === "hours" ? n : (n === 0 ? "00" : n)}
                </div>
              );
            })}
          </div>
        </div>

        <div className="atp-footer">
          <button className="atp-btn" onClick={onCancel}>CANCEL</button>
          <button className="atp-btn" onClick={handleSave}>OK</button>
        </div>
      </div>
    </div>
  );
}
