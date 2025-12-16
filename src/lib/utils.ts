function clsx(...inputs: unknown[]): string {
  const classes: string[] = [];

  const add = (val: unknown) => {
    if (!val) return;
    if (typeof val === "string" || typeof val === "number") {
      classes.push(String(val));
      return;
    }
    if (Array.isArray(val)) {
      val.forEach(add);
      return;
    }
    if (typeof val === "object") {
      for (const key in val as Record<string, any>) {
        if ((val as any)[key]) classes.push(key);
      }
    }
  };

  inputs.forEach(add);
  return classes.join(" ");
}

function twMerge(...inputs: Parameters<typeof clsx>): string {
  // Fallback: delegate to local clsx; install 'tailwind-merge' for advanced merging behavior.
  return clsx(...inputs);
}

export function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(...inputs);
}
