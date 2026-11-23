import { useState } from "react";
import { useStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/primitives";
import type { Child } from "@/types";
export function CreateChildForm({
  onSuccess,
  onCancel,
  defaultParentId,
}: {
  onSuccess: (child: Child) => void;
  onCancel: () => void;
  defaultParentId?: string;
}) {
  const parents = useStore((s) => s.parents);
  const create = useStore((s) => s.createChild);
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [parent, setParent] = useState(defaultParentId || "");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        if (
          name.trim().length < 2 ||
          !birth ||
          birth > new Date().toISOString().slice(0, 10) ||
          !parent
        ) {
          setError("Bola ismi, tug‘ilgan sana va ota-onani tekshiring.");
          return;
        }
        setBusy(true);
        setError("");
        try {
          const child = await create({
            fullName: name.trim(),
            dateOfBirth: birth,
            gender,
            parentId: parent,
            address,
            notes,
            status: "ACTIVE",
          });
          onSuccess(child);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Bola saqlanmadi");
        } finally {
          setBusy(false);
        }
      }}
    >
      <Input
        label="To‘liq ism"
        required
        minLength={2}
        maxLength={150}
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        label="Tug‘ilgan sana"
        type="date"
        required
        max={new Date().toISOString().slice(0, 10)}
        value={birth}
        onChange={(e) => setBirth(e.target.value)}
      />
      <label className="block text-sm font-semibold">
        Jinsi
        <select
          className="block w-full min-h-11 border rounded-lg p-2 mt-1"
          value={gender}
          onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE")}
        >
          <option value="MALE">O‘g‘il</option>
          <option value="FEMALE">Qiz</option>
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Ota-ona
        <select
          required
          className="block w-full min-h-11 border rounded-lg p-2 mt-1"
          value={parent}
          onChange={(e) => setParent(e.target.value)}
        >
          <option value="">Ota-onani tanlang</option>
          {parents
            .filter((p) => p.status !== "ARCHIVED")
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} · {p.phone}
              </option>
            ))}
        </select>
      </label>
      <Input
        label="Manzil (ixtiyoriy)"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <label className="block text-sm font-semibold">
        Qo‘shimcha ma’lumotlar
        <textarea
          className="block w-full border rounded-lg p-3 mt-1"
          rows={3}
          maxLength={5000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <p className="text-sm text-charcoal-600">
        Saqlagandan keyin xizmat va seanslarni bola kartasidan biriktirasiz.
      </p>
      {error && (
        <p role="alert" className="text-danger-main">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          type="button"
          disabled={busy}
          onClick={onCancel}
        >
          Bekor qilish
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saqlanmoqda…" : "Bolani saqlash"}
        </Button>
      </div>
    </form>
  );
}
