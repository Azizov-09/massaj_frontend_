import { useState } from "react";
import { useStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/Modal";
import type { Child } from "@/types";
export function EditChildModal({
  child,
  isOpen,
  onClose,
  onSuccess,
}: {
  child: Child | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  if (!child) return null;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bola ma’lumotlarini tahrirlash"
    >
      <EditForm key={child.id} child={child} onSuccess={onSuccess || onClose} />
    </Modal>
  );
}
function EditForm({
  child,
  onSuccess,
}: {
  child: Child;
  onSuccess: () => void;
}) {
  const update = useStore((s) => s.updateChild);
  const parents = useStore((s) => s.parents);
  const [name, setName] = useState(child.fullName);
  const [birth, setBirth] = useState(child.dateOfBirth);
  const [gender, setGender] = useState(child.gender);
  const [parent, setParent] = useState(child.parentId);
  const [address, setAddress] = useState(child.address || "");
  const [notes, setNotes] = useState(child.notes || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setError("");
        try {
          await update(child.id, {
            fullName: name.trim(),
            dateOfBirth: birth,
            gender,
            parentId: parent,
            address,
            notes,
          });
          onSuccess();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Saqlanmadi");
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
          className="block min-h-11 border rounded-lg p-2 mt-1 w-full"
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
          disabled={Boolean(child.parentId)}
          required
          className="block min-h-11 border rounded-lg p-2 mt-1 w-full"
          value={parent}
          onChange={(e) => setParent(e.target.value)}
        >
          <option value="">Ota-onani tanlang</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName}
            </option>
          ))}
        </select>
      </label>
      <Input
        label="Manzil"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <label className="block text-sm font-semibold">
        Qo‘shimcha ma’lumotlar
        <textarea
          className="block w-full border rounded-lg p-3 mt-1"
          rows={3}
          value={notes}
          maxLength={5000}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="text-danger-main">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? "Saqlanmoqda…" : "Saqlash"}
      </Button>
    </form>
  );
}
