import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface SelectorProps {
  algorithm: "AES-GCM" | "RSA-OAEP";
  setAlgorithm: React.Dispatch<React.SetStateAction<"AES-GCM" | "RSA-OAEP">>;
}

export const Selector = ({ algorithm, setAlgorithm }: SelectorProps) => {
  return (
    <>
      <Label>Algorithm</Label>

      <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as any)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="AES-GCM">AES-GCM</SelectItem>
          <SelectItem value="RSA-OAEP">RSA-OAEP (hybrid)</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
};
