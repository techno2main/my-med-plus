import { useState, useEffect, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Keyboard } from "lucide-react";

interface TimePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
}

export function TimePickerDialog({
  open,
  onOpenChange,
  value,
  onValueChange,
}: TimePickerDialogProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [mode, setMode] = useState<"hours" | "minutes">("hours");
  const [inputMode, setInputMode] = useState<"dial" | "input">("dial");
  const [hourInput, setHourInput] = useState("");
  const [minuteInput, setMinuteInput] = useState("");
  const hourInputRef = useRef<HTMLInputElement>(null);
  const minuteInputRef = useRef<HTMLInputElement>(null);

  const getInitialTime = () => {
    if (value && value.includes(":")) {
      const [h, m] = value.split(":");
      return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
    }
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (open) {
      // Si une valeur existe, pré-sélectionner l'heure et les minutes
      if (value && value.includes(":")) {
        const [h, m] = value.split(":");
        const hour = parseInt(h, 10);
        const minute = parseInt(m, 10);
        setSelectedHour(hour);
        setSelectedMinute(minute);
        setHourInput(h.padStart(2, "0"));
        setMinuteInput(m.padStart(2, "0"));
        setMode("hours");
      } else {
        setSelectedHour(null);
        setSelectedMinute(null);
        setHourInput("");
        setMinuteInput("");
        setMode("hours");
      }
      setInputMode("dial");
    }
  }, [open, value]);

  // Synchroniser les inputs texte avec les valeurs sélectionnées UNIQUEMENT en mode dial
  useEffect(() => {
    if (selectedHour !== null && inputMode === "dial") {
      setHourInput(selectedHour.toString().padStart(2, "0"));
    }
  }, [selectedHour, inputMode]);

  useEffect(() => {
    if (selectedMinute !== null && inputMode === "dial") {
      setMinuteInput(selectedMinute.toString().padStart(2, "0"));
    }
  }, [selectedMinute, inputMode]);

  const handleConfirm = () => {
    if (selectedHour !== null && selectedMinute !== null) {
      const timeStr = `${selectedHour.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;
      onValueChange(timeStr);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleHourClick = (hour: number) => {
    setSelectedHour(hour);
    setMode("minutes");
  };

  const handleMinuteClick = (minute: number) => {
    setSelectedMinute(minute);
  };

  const handleHourInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    setHourInput(val);
    
    // Ne mettre à jour selectedHour que si on a 1 ou 2 chiffres valides
    if (val.length > 0) {
      const hour = parseInt(val, 10);
      if (!isNaN(hour) && hour >= 0 && hour <= 23) {
        setSelectedHour(hour);
      }
    }
  };

  const handleMinuteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    setMinuteInput(val);
    
    // Ne mettre à jour selectedMinute que si on a 1 ou 2 chiffres valides
    if (val.length > 0) {
      const minute = parseInt(val, 10);
      if (!isNaN(minute) && minute >= 0 && minute <= 59) {
        setSelectedMinute(minute);
      }
    }
  };

  const handleHourInputClick = () => {
    setMode("hours");
    if (inputMode === "input") {
      hourInputRef.current?.select();
    }
  };

  const handleMinuteInputClick = () => {
    setMode("minutes");
    if (inputMode === "input") {
      minuteInputRef.current?.select();
    }
  };

  const toggleInputMode = () => {
    setInputMode(prev => prev === "dial" ? "input" : "dial");
  };

  // CERCLE INTÉRIEUR : heures 1-12
  const innerHourPositions = Array.from({ length: 12 }, (_, i) => {
    const hour = i === 0 ? 12 : i;
    const angle = (i * 360) / 12 - 90;
    const radius = 22; // RÉDUIT pour plus d'espace intérieur
    const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
    const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
    return { hour, x, y };
  });

  // CERCLE EXTÉRIEUR : heures 00, 13-23
  const outerHourPositions = Array.from({ length: 12 }, (_, i) => {
    const hour = i === 0 ? 0 : i + 12;
    const angle = (i * 360) / 12 - 90;
    const radius = 38; // RÉDUIT pour plus d'espace intérieur
    const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
    const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
    return { hour, x, y };
  });

  // Minutes
  const minutePositions = Array.from({ length: 60 }, (_, i) => {
    const minute = i;
    const angle = (i * 360) / 60 - 90;
    const radius = 38; // RÉDUIT pour plus d'espace intérieur
    const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
    const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
    const showNumber = minute % 5 === 0;
    return { minute, x, y, showNumber };
  });

  const getDisplayTime = () => {
    return {
      hours: hourInput || "00",
      minutes: minuteInput || "00"
    };
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-[340px] translate-x-[-50%] translate-y-[-50%]">
          <DialogPrimitive.Title className="sr-only">Sélectionner l'heure</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Choisissez l'heure et les minutes</DialogPrimitive.Description>
          
          <div className="flex flex-col bg-white rounded-lg overflow-hidden shadow-2xl">
            {/* En-tête avec l'heure - Style Material Design */}
            <div 
              className="px-6 py-6 text-center"
              style={{ backgroundColor: '#ffffffff' }}
            >
              <div className="text-sm font-medium mb-3" style={{ color: '#1976D2' }}>
                Choisir l'heure
              </div>
              
              <div className="flex items-center justify-center gap-1">
                {inputMode === "input" ? (
                  <>
                    {/* Mode INPUT - Champs éditables */}
                    <input
                      ref={hourInputRef}
                      type="text"
                      value={hourInput}
                      onChange={handleHourInputChange}
                      onClick={handleHourInputClick}
                      className="w-20 h-20 text-5xl font-normal text-center rounded-lg outline-none transition-colors"
                      style={{
                        backgroundColor: mode === "hours" ? '#1976D2' : 'transparent',
                        color: mode === "hours" ? 'white' : '#1D1B20'
                      }}
                      maxLength={2}
                      placeholder="00"
                    />
                    <span className="text-5xl font-normal" style={{ color: '#1D1B20' }}>:</span>
                    <input
                      ref={minuteInputRef}
                      type="text"
                      value={minuteInput}
                      onChange={handleMinuteInputChange}
                      onClick={handleMinuteInputClick}
                      className="w-20 h-20 text-5xl font-normal text-center rounded-lg outline-none transition-colors"
                      style={{
                        backgroundColor: mode === "minutes" ? '#1976D2' : 'transparent',
                        color: mode === "minutes" ? 'white' : '#1D1B20'
                      }}
                      maxLength={2}
                      placeholder="00"
                    />
                  </>
                ) : (
                  <>
                    {/* Mode DIAL - Boutons cliquables */}
                    <button
                      type="button"
                      onClick={handleHourInputClick}
                      className="w-20 h-20 text-5xl font-normal rounded-lg transition-colors"
                      style={{
                        backgroundColor: mode === "hours" ? '#1976D2' : 'transparent',
                        color: mode === "hours" ? 'white' : '#1D1B20'
                      }}
                    >
                      {getDisplayTime().hours}
                    </button>
                    <span className="text-5xl font-normal" style={{ color: '#1D1B20' }}>:</span>
                    <button
                      type="button"
                      onClick={handleMinuteInputClick}
                      className="w-20 h-20 text-5xl font-normal rounded-lg transition-colors"
                      style={{
                        backgroundColor: mode === "minutes" ? '#1976D2' : 'transparent',
                        color: mode === "minutes" ? 'white' : '#1D1B20'
                      }}
                    >
                      {getDisplayTime().minutes}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Cercle ou Input selon le mode */}
            {inputMode === "dial" ? (
              <div className="relative w-full bg-white p-8">
                <div className="relative w-full" style={{ paddingBottom: '100%' }}>
                  <svg 
                    viewBox="0 0 100 100" 
                    className="absolute inset-0 w-full h-full"
                  >
                    {/* Cercle de fond */}
                    <circle cx="50" cy="50" r="45" fill="#1976D2" />

                  {mode === "hours" ? (
                    <>
                      {/* CERCLE EXTÉRIEUR - Heures 00, 13-23 */}
                      {outerHourPositions.map(({ hour, x, y }) => (
                        <text
                          key={`hour-outer-${hour}`}
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{
                            fontSize: '4.5px',
                            fontWeight: '400',
                            fill: '#ffffffff',
                            opacity: selectedHour === hour ? 1 : 0.75,
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                          onClick={() => handleHourClick(hour)}
                        >
                          {hour === 0 ? "00" : hour}
                        </text>
                      ))}

                      {/* CERCLE INTÉRIEUR - Heures 1-12 */}
                      {innerHourPositions.map(({ hour, x, y }) => (
                        <text
                          key={`hour-inner-${hour}`}
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{
                            fontSize: '5px',
                            fontWeight: '500',
                            fill: '#ffffffff',
                            opacity: selectedHour === hour ? 1 : 0.9,
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                          onClick={() => handleHourClick(hour)}
                        >
                          {hour}
                        </text>
                      ))}

                      {/* AIGUILLE HEURES - Visible uniquement en mode heures */}
                      {selectedHour !== null && (() => {
                        const isInner = selectedHour >= 1 && selectedHour <= 12;
                        const positions = isInner ? innerHourPositions : outerHourPositions;
                        const pos = positions.find(p => p.hour === selectedHour);
                        if (!pos) return null;
                        return (
                          <g key="hour-hand">
                            <line
                              x1="50"
                              y1="50"
                              x2={pos.x}
                              y2={pos.y}
                              stroke="#a8ecefff"
                              strokeWidth="0.5"
                              strokeLinecap="round"
                            />
                            <circle 
                              cx={pos.x} 
                              cy={pos.y} 
                              r="3" 
                              fill="#a8ecefff"
                            />
                          </g>
                        );
                      })()}
                    </>
                  ) : (
                    <>
                      {/* MINUTES - Affichage des multiples de 5 */}
                      {minutePositions.filter(p => p.showNumber).map(({ minute, x, y }) => (
                        <text
                          key={`minute-${minute}`}
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{
                            fontSize: '4.5px',
                            fontWeight: '500',
                            fill: '#a8ecefff',
                            opacity: selectedMinute === minute ? 1 : 0.8,
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                          onClick={() => handleMinuteClick(minute)}
                        >
                          {minute.toString().padStart(2, "0")}
                        </text>
                      ))}

                      {/* AIGUILLE MINUTES - Visible uniquement en mode minutes */}
                      {selectedMinute !== null && (() => {
                        const pos = minutePositions.find(p => p.minute === selectedMinute);
                        if (!pos) return null;
                        return (
                          <g key="minute-hand">
                            <line
                              x1="50"
                              y1="50"
                              x2={pos.x}
                              y2={pos.y}
                              stroke="#a8ecefff"
                              strokeWidth="0.5"
                              strokeLinecap="round"
                            />
                            <circle 
                              cx={pos.x} 
                              cy={pos.y} 
                              r="3" 
                              fill="#a8ecefff"
                            />
                          </g>
                        );
                      })()}
                    </>
                  )}

                    {/* Point central */}
                    <circle cx="50" cy="50" r="2" fill="#a8ecefff" opacity="0.9" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                Mode saisie directe
              </div>
            )}

            {/* Boutons avec icône clavier */}
            <div className="flex border-t items-center">
              <button
                type="button"
                onClick={toggleInputMode}
                className="p-4 hover:bg-gray-50 transition-colors"
                title={inputMode === "dial" ? "Saisie au clavier" : "Sélection au cadran"}
              >
                <Keyboard size={20} style={{ color: '#1976D2' }} />
              </button>
              <div className="flex-1 flex">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-4 text-center font-medium text-base uppercase tracking-wide"
                  style={{ color: '#1976D2' }}
                >
                  Annuler
                </button>
                <div className="w-px bg-gray-200" />
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={selectedHour === null || selectedMinute === null}
                  className="flex-1 py-4 text-center font-medium text-base uppercase tracking-wide disabled:opacity-30"
                  style={{ color: '#1976D2' }}
                >
                  Ok
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// Composant wrapper pour remplacer TimeSelect
interface TimePickerInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TimePickerInput({
  value,
  onValueChange,
  placeholder = "HH:MM",
  className,
}: TimePickerInputProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left ${className}`}
      >
        {value || <span className="text-muted-foreground">{placeholder}</span>}
      </button>
      <TimePickerDialog
        open={open}
        onOpenChange={setOpen}
        value={value}
        onValueChange={onValueChange}
      />
    </>
  );
}
