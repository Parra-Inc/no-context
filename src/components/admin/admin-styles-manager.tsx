"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface AdminStyle {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  enabledByDefault: boolean;
  channelStyleCount: number;
  createdAt: string;
}

interface AdminStylesManagerProps {
  initialStyles: AdminStyle[];
}

export function AdminStylesManager({ initialStyles }: AdminStylesManagerProps) {
  const [styles, setStyles] = useState(initialStyles);
  const [createOpen, setCreateOpen] = useState(false);
  const [editStyle, setEditStyle] = useState<AdminStyle | null>(null);
  const [deleteStyle, setDeleteStyle] = useState<AdminStyle | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: "",
    displayName: "",
    description: "",
    enabledByDefault: true,
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    displayName: "",
    description: "",
    enabledByDefault: true,
  });

  function resetCreateForm() {
    setCreateForm({
      name: "",
      displayName: "",
      description: "",
      enabledByDefault: true,
    });
    setError(null);
  }

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create style");
        return;
      }
      const newStyle = await res.json();
      setStyles((prev) => [
        ...prev,
        {
          ...newStyle,
          channelStyleCount: 0,
          createdAt: newStyle.createdAt,
        },
      ]);
      setCreateOpen(false);
      resetCreateForm();
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!editStyle) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/styles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editStyle.id, ...editForm }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update style");
        return;
      }
      const updated = await res.json();
      setStyles((prev) =>
        prev.map((s) =>
          s.id === updated.id
            ? {
                ...s,
                displayName: updated.displayName,
                description: updated.description,
                enabledByDefault: updated.enabledByDefault,
              }
            : s,
        ),
      );
      setEditStyle(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteStyle) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/styles?id=${deleteStyle.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete style");
        return;
      }
      setStyles((prev) => prev.filter((s) => s.id !== deleteStyle.id));
      setDeleteStyle(null);
    } finally {
      setSaving(false);
    }
  }

  function openEdit(style: AdminStyle) {
    setEditForm({
      displayName: style.displayName,
      description: style.description,
      enabledByDefault: style.enabledByDefault,
    });
    setError(null);
    setEditStyle(style);
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-[#4A4A4A]">
              {styles.length} style{styles.length !== 1 ? "s" : ""}
            </p>
            <Button
              size="sm"
              onClick={() => {
                resetCreateForm();
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create Style
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E5E5]">
                  <th className="pr-4 pb-3 text-left font-medium text-[#4A4A4A]">
                    Display Name
                  </th>
                  <th className="pr-4 pb-3 text-left font-medium text-[#4A4A4A]">
                    Name
                  </th>
                  <th className="pr-4 pb-3 text-left font-medium text-[#4A4A4A]">
                    Description
                  </th>
                  <th className="pr-4 pb-3 text-left font-medium text-[#4A4A4A]">
                    Default
                  </th>
                  <th className="pb-3 text-right font-medium text-[#4A4A4A]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {styles.map((style) => (
                  <tr
                    key={style.id}
                    className="border-b border-[#E5E5E5] last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-[#1A1A1A]">
                      {style.displayName}
                    </td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-[#4A4A4A]">
                        {style.name}
                      </code>
                    </td>
                    <td className="max-w-xs truncate py-3 pr-4 text-[#4A4A4A]">
                      {style.description}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant={
                          style.enabledByDefault ? "success" : "secondary"
                        }
                      >
                        {style.enabledByDefault ? "Enabled" : "Disabled"}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEdit(style)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            setError(null);
                            setDeleteStyle(style);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {styles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#4A4A4A]">
                      No styles yet. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Style</DialogTitle>
            <DialogDescription>
              Add a new default style available to all workspaces.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Name (slug)
              </label>
              <Input
                placeholder="e.g. watercolor"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, name: e.target.value }))
                }
              />
              <p className="mt-1 text-xs text-[#9A9A9A]">
                Lowercase letters, numbers, and hyphens only.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Display Name
              </label>
              <Input
                placeholder="e.g. Watercolor"
                value={createForm.displayName}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, displayName: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Description / Prompt Modifier
              </label>
              <textarea
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                rows={3}
                placeholder="Describe the art style for the AI image generator..."
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="create-enabled-default"
                checked={createForm.enabledByDefault}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    enabledByDefault: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <label
                htmlFor="create-enabled-default"
                className="text-sm text-[#1A1A1A]"
              >
                Enabled by default for all channels
              </label>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editStyle}
        onOpenChange={(open) => !open && setEditStyle(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Style</DialogTitle>
            <DialogDescription>
              Update <strong>{editStyle?.displayName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Name (slug)
              </label>
              <Input value={editStyle?.name ?? ""} disabled />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Display Name
              </label>
              <Input
                value={editForm.displayName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, displayName: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Description / Prompt Modifier
              </label>
              <textarea
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                rows={3}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-enabled-default"
                checked={editForm.enabledByDefault}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    enabledByDefault: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <label
                htmlFor="edit-enabled-default"
                className="text-sm text-[#1A1A1A]"
              >
                Enabled by default for all channels
              </label>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditStyle(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteStyle}
        onOpenChange={(open) => !open && setDeleteStyle(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Style</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{" "}
              <strong>{deleteStyle?.displayName}</strong>? This will also remove
              all associated channel style records. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteStyle(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
