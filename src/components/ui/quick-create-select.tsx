"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface QCOption {
  id: number;
  name: string;
}

interface ContactFields {
  phoneNo: string;
  address: string;
  city: string;
  province: string;
  pincode: string;
  gst: string;
}

const emptyContact: ContactFields = {
  phoneNo: "",
  address: "",
  city: "",
  province: "",
  pincode: "",
  gst: "",
};

interface QuickCreateSelectProps {
  label: string;
  value: number | string;
  onChange: (id: number) => void;
  options: QCOption[];
  onAdd: (item: QCOption) => void;
  createUrl: string;
  placeholder?: string;
  required?: boolean;
  selectClassName?: string;
  compact?: boolean;
  /** Show full contact fields (name, phone, address, city, province, pincode, gst) — for buyer/supplier/consignee */
  contactFields?: boolean;
}

export function QuickCreateSelect({
  label,
  value,
  onChange,
  options,
  onAdd,
  createUrl,
  placeholder,
  required,
  selectClassName,
  compact = false,
  contactFields = false,
}: QuickCreateSelectProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState<ContactFields>(emptyContact);
  const [saving, setSaving] = useState(false);

  const setField = (field: keyof ContactFields, val: string) =>
    setContact((prev) => ({ ...prev, [field]: val }));

  const resetForm = () => {
    setName("");
    setContact(emptyContact);
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const body = contactFields
        ? { name: trimmed, ...contact }
        : { name: trimmed };
      const res = await fetch(createUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to create");
      }
      const created = await res.json();
      const newItem: QCOption = { id: created.id, name: created.name };
      onAdd(newItem);
      onChange(created.id);
      setOpen(false);
      resetForm();
      toast.success(`${label} created`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Failed to create ${label}`);
    } finally {
      setSaving(false);
    }
  };

  const h = compact ? "h-9" : "h-10";
  const btnH = compact ? "h-9 w-9" : "h-10 w-10";

  return (
    <>
      <div className="flex gap-1.5 items-center w-full">
        <select
          className={cn(
            `flex ${h} w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400`,
            selectClassName
          )}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          required={required}
        >
          <option value="">{placeholder ?? `Select ${label}`}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            `${btnH} shrink-0 border-dashed hover:border-indigo-400 hover:text-indigo-600`
          )}
          onClick={() => setOpen(true)}
          title={`Add new ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogContent className={contactFields ? "max-w-lg" : "max-w-sm"}>
          <DialogHeader>
            <DialogTitle>New {label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {contactFields ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="qc-name">Name *</Label>
                  <Input
                    id="qc-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`Enter ${label.toLowerCase()} name...`}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qc-phone">Phone No</Label>
                  <Input
                    id="qc-phone"
                    value={contact.phoneNo}
                    onChange={(e) => setField("phoneNo", e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="qc-address">Address</Label>
                  <Input
                    id="qc-address"
                    value={contact.address}
                    onChange={(e) => setField("address", e.target.value)}
                    placeholder="Street address"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qc-city">City</Label>
                  <Input
                    id="qc-city"
                    value={contact.city}
                    onChange={(e) => setField("city", e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qc-province">Province</Label>
                  <Input
                    id="qc-province"
                    value={contact.province}
                    onChange={(e) => setField("province", e.target.value)}
                    placeholder="Province / State"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qc-pincode">Pincode</Label>
                  <Input
                    id="qc-pincode"
                    value={contact.pincode}
                    onChange={(e) => setField("pincode", e.target.value)}
                    placeholder="Pincode"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qc-gst">GST</Label>
                  <Input
                    id="qc-gst"
                    value={contact.gst}
                    onChange={(e) => setField("gst", e.target.value)}
                    placeholder="GST number"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="qc-name">Name *</Label>
                <Input
                  id="qc-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreate();
                    }
                  }}
                  placeholder={`Enter ${label.toLowerCase()} name...`}
                  autoFocus
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!name.trim() || saving}
                onClick={handleCreate}
                className="bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.98] transition-all"
              >
                {saving ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
