"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Inbox, Check, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/workspace-context";

interface Collection {
  id: string;
  name: string;
  emoji: string | null;
  quoteCount: number;
  isInCollection: boolean;
}

interface ManageCollectionsDialogProps {
  quoteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageCollectionsDialog({
  quoteId,
  open,
  onOpenChange,
}: ManageCollectionsDialogProps) {
  const { workspaceId } = useWorkspace();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);

  useEffect(() => {
    if (open && quoteId) {
      fetchCollections();
    }
  }, [open, quoteId]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/quotes/${quoteId}/collections`, {
        headers: { "X-Workspace-Id": workspaceId },
      });
      if (res.ok) {
        const data: Collection[] = await res.json();
        setCollections(data);
        const initialSelected = new Set<string>(
          data.filter((c) => c.isInCollection).map((c) => c.id),
        );
        setSelectedIds(initialSelected);
      }
    } catch {
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCollection = (collectionId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set<string>(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return newSet;
    });
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    try {
      setCreating(true);
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Workspace-Id": workspaceId,
        },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      });

      if (res.ok) {
        const newCollection = await res.json();
        setCollections((prev) => [
          {
            id: newCollection.id,
            name: newCollection.name,
            emoji: newCollection.emoji,
            quoteCount: 0,
            isInCollection: false,
          },
          ...prev,
        ]);
        setSelectedIds((prev) => new Set<string>([...prev, newCollection.id]));
        setNewCollectionName("");
        setShowNewCollectionInput(false);
        toast.success("Collection created");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create collection");
      }
    } catch {
      toast.error("Failed to create collection");
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/quotes/${quoteId}/collections`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Workspace-Id": workspaceId,
        },
        body: JSON.stringify({ collectionIds: Array.from(selectedIds) }),
      });

      if (res.ok) {
        toast.success("Collections updated");
        onOpenChange(false);
      } else {
        toast.error("Failed to update collections");
      }
    } catch {
      toast.error("Failed to update collections");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-[425px]">
        <div className="bg-muted/30 flex items-start gap-3 border-b px-6 py-4 pr-14">
          <div className="bg-primary/10 border-primary/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border">
            <FolderKanban className="text-primary h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">Manage Collections</h3>
            <p className="text-muted-foreground text-xs">
              Choose which collections to add this quote to.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 p-6">
            {/* Collections list */}
            <div className="max-h-[300px] space-y-1 overflow-y-auto">
              {collections.length === 0 && !showNewCollectionInput ? (
                <div className="text-muted-foreground py-6 text-center text-sm">
                  No collections yet. Create one to get started.
                </div>
              ) : (
                collections.map((collection) => {
                  const isSelected = selectedIds.has(collection.id);
                  return (
                    <button
                      key={collection.id}
                      type="button"
                      onClick={() => handleToggleCollection(collection.id)}
                      className="hover:bg-muted/50 flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-left transition-colors"
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-input"
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                      {collection.emoji && (
                        <span className="shrink-0 text-base">
                          {collection.emoji}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {collection.name}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {collection.quoteCount}{" "}
                          {collection.quoteCount === 1 ? "quote" : "quotes"}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Create new collection */}
            {showNewCollectionInput ? (
              <div className="bg-background flex items-center gap-0.5 rounded-lg border px-1.5 py-1.5 pl-1">
                <Input
                  placeholder="Collection name..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateCollection();
                    } else if (e.key === "Escape") {
                      setShowNewCollectionInput(false);
                      setNewCollectionName("");
                    }
                  }}
                  autoFocus
                  disabled={creating}
                  className="h-8 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                  size="sm"
                  className="h-8"
                  onClick={handleCreateCollection}
                  disabled={!newCollectionName.trim() || creating}
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowNewCollectionInput(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Collection
              </Button>
            )}

            {/* Save button */}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
