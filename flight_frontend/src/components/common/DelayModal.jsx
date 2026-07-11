import React, { useState, useEffect } from "react";
import "./DelayModal.css";

export default function DelayModal({ isOpen, onClose, onConfirm }) {
  const [minutes, setMinutes] = useState(30);

  // каждый раз при открытии сбрасываем значение по умолчанию
  useEffect(() => {
    if (isOpen) {
      setMinutes(30);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="delay-popover">
      <div className="delay-popover-body">
        <label className="delay-label">
          На сколько минут задержать рейс?
        </label>
        <input
          type="number"
          min="5"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="delay-input"
        />
      </div>
      <div className="delay-actions">
        <button onClick={onClose} className="btn-cancel">
          Отмена
        </button>
        <button
          onClick={() => onConfirm(parseInt(minutes, 10))}
          className="btn-confirm"
        >
          Подтвердить
        </button>
      </div>
    </div>
  );
}
