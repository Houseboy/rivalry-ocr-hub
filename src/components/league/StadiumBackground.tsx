import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const StadiumBackground = ({
  gradientClass,
  watermarkUrl,
  watermarkAlt,
  children,
  className,
}: {
  gradientClass?: string;
  watermarkUrl?: string;
  watermarkAlt?: string;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className={cn(
          "absolute inset-0 -z-10 bg-gradient-to-br opacity-25",
          gradientClass
        )}
      />
      <div className="absolute inset-0 -z-10 bg-background/85" />

      <div
        className="absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
        }}
      />

      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08)_0%,rgba(0,0,0,0.35)_55%,rgba(0,0,0,0.8)_100%)]" />

      <div
        className={cn(
          "absolute -z-10 blur-3xl opacity-25",
          "top-[-140px] left-1/2 h-[520px] w-[720px] -translate-x-1/2",
          "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0)_60%)]"
        )}
      />

      <div
        className={cn(
          "absolute -z-10 blur-3xl opacity-20",
          "bottom-[-220px] right-[-160px] h-[520px] w-[520px]",
          "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_65%)]"
        )}
      />

      {watermarkUrl && (
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <img
            src={watermarkUrl}
            alt={watermarkAlt || "watermark"}
            className="w-[560px] max-w-[88vw] opacity-[0.07] blur-[0.2px]"
            loading="lazy"
            draggable={false}
          />
        </div>
      )}

      {children}
    </div>
  );
};

export default StadiumBackground;
