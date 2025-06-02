import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function withTimestamp(file: File): File {
  const { name, type, lastModified } = file;

  const i = name.lastIndexOf(".");
  const hasExtension = i > 0; // dot not first char

  const base = hasExtension ? name.slice(0, i) : name; // "a.b"
  const ext = hasExtension ? name.slice(i) : ""; // ".c" or ""

  const newName = `${base}_${Date.now()}${ext}`;

  return new File([file], newName, { type, lastModified });
}
