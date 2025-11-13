import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

export interface BoxShadow {
  x: number;
  y: number;
  blur: number;
  color: string;
}

function Shadow({
  label,
  value,
  onChange
}: {
  label: string;
  value: BoxShadow;
  onChange: (v: BoxShadow) => void;
}) {
  const [localValue, setLocalValue] = useState<BoxShadow>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="flex flex-col gap-2 py-4">
      <Label className="font-sans text-xs font-semibold">{label}</Label>

      <div className="flex gap-2">
        <div className="flex flex-1 items-center text-sm text-muted-foreground">
          Color
        </div>
        <div className="relative w-32">
          <div className="relative">
            <div
              style={{ backgroundColor: localValue.color }}
              className="absolute left-0.5 top-0.5 h-7 w-7 flex-none cursor-pointer rounded-md border border-border"
            />
            <Input
              className="h-8 pl-10"
              value={localValue.color}
              onChange={(e) => {
                const newValue = { ...localValue, color: e.target.value };
                setLocalValue(newValue);
                onChange(newValue);
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 items-center text-sm text-muted-foreground">
          X
        </div>
        <div className="relative w-32">
          <Input
            className="h-8"
            type="number"
            value={localValue.x}
            onChange={(e) => {
              const newValue = { ...localValue, x: Number(e.target.value) };
              setLocalValue(newValue);
              onChange(newValue);
            }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 items-center text-sm text-muted-foreground">
          Y
        </div>
        <div className="relative w-32">
          <Input
            className="h-8"
            type="number"
            value={localValue.y}
            onChange={(e) => {
              const newValue = { ...localValue, y: Number(e.target.value) };
              setLocalValue(newValue);
              onChange(newValue);
            }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 items-center text-sm text-muted-foreground">
          Blur
        </div>
        <div className="relative w-32">
          <Input
            className="h-8"
            type="number"
            value={localValue.blur}
            onChange={(e) => {
              const newValue = { ...localValue, blur: Number(e.target.value) };
              setLocalValue(newValue);
              onChange(newValue);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Shadow;
