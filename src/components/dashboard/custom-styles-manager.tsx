"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Palette } from "lucide-react";
import { toast } from "sonner";

interface CustomStyle {
  id: string;
  name: string;
  displayName: string;
  prompt: string;
}

interface CustomStylesManagerProps {
  customStyles: CustomStyle[];
}

export function CustomStylesManager({
  customStyles: initialStyles,
}: CustomStylesManagerProps) {
  const [styles, setStyles] = useState(initialStyles);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomStyle | null>(null);
  const [creating, setCreating] = useState(false);

  const [newName, setNewName] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPrompt, setNewPrompt] = useState("");

  async function createStyle() {
    if (!newName || !newDisplayName || !newPrompt) {
      toast.error("All fields are required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/settings/styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.toLowerCase().replace(/\s+/g, "-"),
          displayName: newDisplayName,
          prompt: newPrompt,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create style");
        return;
      }

      const style = await res.json();
      setStyles((prev) => [...prev, style]);
      setCreateOpen(false);
      setNewName("");
      setNewDisplayName("");
      setNewPrompt("");
      toast.success(`"${newDisplayName}" style created`);
    } catch {
      toast.error("Failed to create style");
    } finally {
      setCreating(false);
    }
  }

  async function deleteStyle(style: CustomStyle) {
    setStyles((prev) => prev.filter((s) => s.id !== style.id));
    setDeleteTarget(null);

    try {
      await fetch(`/api/settings/styles?id=${style.id}`, {
        method: "DELETE",
      });
      toast.success(`"${style.displayName}" deleted`);
    } catch {
      setStyles((prev) => [...prev, style]);
      toast.error("Failed to delete style");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-3.5 w-3.5" />
              Create Style
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Style</DialogTitle>
              <DialogDescription>
                Define a new art style with a custom prompt modifier.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Display Name
                </label>
                <Input
                  placeholder="e.g. Retro Synthwave"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Slug</label>
                <Input
                  placeholder="e.g. retro-synthwave"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <p className="text-muted-foreground/60 mt-1 text-xs">
                  Lowercase letters, numbers, and hyphens only.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Prompt</label>
                <textarea
                  placeholder="Describe the art style for the AI image generator..."
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="border-input w-full rounded-md border px-3 py-2 text-sm"
                />
                <p className="text-muted-foreground/60 mt-1 text-xs">
                  {newPrompt.length}/500 characters
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createStyle} disabled={creating}>
                {creating ? "Creating..." : "Create Style"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {styles.length > 0 ? (
        <div className="space-y-2">
          {styles.map((style) => (
            <div
              key={style.id}
              className="border-border bg-muted/50 flex items-center justify-between rounded-xl border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-200 to-purple-200">
                  <Palette className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    {style.displayName}
                  </p>
                  <p className="text-muted-foreground line-clamp-1 text-xs">
                    {style.prompt}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(style)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed py-10">
          <Palette className="text-muted-foreground/30 h-8 w-8" />
          <p className="text-muted-foreground mt-2 text-sm">
            No custom styles yet.
          </p>
          <p className="text-muted-foreground/60 mt-1 text-xs">
            Create one to add your own art style to the mix.
          </p>
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Style</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>&ldquo;{deleteTarget?.displayName}&rdquo;</strong>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteStyle(deleteTarget)}
            >
              Delete Style
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
