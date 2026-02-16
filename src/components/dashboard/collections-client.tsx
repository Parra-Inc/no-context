"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Inbox,
  Settings,
  Plus,
  Loader2,
  Trash2,
  Search,
  GripVertical,
  Lock,
  FolderKanban,
  ArrowUpRight,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/workspace-context";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Collection {
  id: string;
  name: string;
  emoji: string | null;
  sortOrder: number;
  coverImage: string | null;
  quoteCount: number;
}

interface CollectionsClientProps {
  subscriptionTier: string;
}

interface SortableCollectionItemProps {
  collection: Collection;
  onDelete: (id: string) => void;
  onUpdate: (
    id: string,
    updates: { name?: string; emoji?: string | null },
  ) => void;
  isDeleting: boolean;
}

function SortableCollectionItem({
  collection,
  onDelete,
  onUpdate,
  isDeleting,
}: SortableCollectionItemProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(collection.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: collection.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const handleSaveName = () => {
    if (editedName.trim() && editedName.trim() !== collection.name) {
      onUpdate(collection.id, { name: editedName.trim() });
    } else {
      setEditedName(collection.name);
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === "Escape") {
      setEditedName(collection.name);
      setIsEditingName(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="hover:bg-muted/50 flex items-center justify-between px-3 py-2.5 transition-colors"
    >
      <div className="flex min-w-0 items-center gap-2">
        {collection.emoji ? (
          <span className="shrink-0 text-base">{collection.emoji}</span>
        ) : (
          <Inbox className="text-primary h-4 w-4 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          {isEditingName ? (
            <Input
              ref={inputRef}
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyDown}
              className="h-6 px-1 py-0 text-sm font-medium"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="hover:bg-muted/50 -mx-1 w-full cursor-pointer truncate rounded px-1 py-0.5 text-left text-sm font-medium transition-colors"
            >
              {collection.name}
            </button>
          )}
          <div className="text-muted-foreground px-1 text-xs">
            {collection.quoteCount}{" "}
            {collection.quoteCount === 1 ? "quote" : "quotes"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 shrink-0"
          onClick={() => onDelete(collection.id)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
        <div
          {...attributes}
          {...listeners}
          className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center"
        >
          <GripVertical className="text-muted-foreground h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export function CollectionsClient({
  subscriptionTier,
}: CollectionsClientProps) {
  const { workspaceId, workspaceSlug } = useWorkspace();
  const isPaid = subscriptionTier !== "FREE";
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showNewCollectionPopover, setShowNewCollectionPopover] =
    useState(false);
  const [manageNewName, setManageNewName] = useState("");

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const filteredCollections = collections.filter((collection) =>
    collection.name.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const res = await fetch("/api/collections", {
        headers: { "X-Workspace-Id": workspaceId },
      });
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async (
    name: string,
    onSuccess?: () => void,
  ) => {
    if (!name.trim()) return;

    try {
      setCreatingCollection(true);
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Workspace-Id": workspaceId,
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (res.ok) {
        const newCollection = await res.json();
        setCollections((prev) => [
          {
            id: newCollection.id,
            name: newCollection.name,
            emoji: newCollection.emoji,
            sortOrder: 0,
            coverImage: null,
            quoteCount: 0,
          },
          ...prev,
        ]);
        toast.success("Collection created");
        onSuccess?.();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create collection");
      }
    } catch {
      toast.error("Failed to create collection");
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleCreateFromPopover = () => {
    handleCreateCollection(newCollectionName, () => {
      setNewCollectionName("");
      setShowNewCollectionPopover(false);
    });
  };

  const handleCreateFromManageDialog = () => {
    handleCreateCollection(manageNewName, () => {
      setManageNewName("");
    });
  };

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      setDeletingId(collectionId);
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: "DELETE",
        headers: { "X-Workspace-Id": workspaceId },
      });

      if (res.ok) {
        setCollections((prev) => prev.filter((c) => c.id !== collectionId));
        toast.success("Collection deleted");
      } else {
        toast.error("Failed to delete collection");
      }
    } catch {
      toast.error("Failed to delete collection");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateCollection = async (
    collectionId: string,
    updates: { name?: string; emoji?: string | null },
  ) => {
    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Workspace-Id": workspaceId,
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        setCollections((prev) =>
          prev.map((c) => (c.id === collectionId ? { ...c, ...updates } : c)),
        );
        toast.success("Collection updated");
      } else {
        toast.error("Failed to update collection");
      }
    } catch {
      toast.error("Failed to update collection");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = collections.findIndex((c) => c.id === active.id);
      const newIndex = collections.findIndex((c) => c.id === over.id);

      const newOrder = arrayMove(collections, oldIndex, newIndex);
      setCollections(newOrder);

      try {
        await fetch("/api/collections/reorder", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Workspace-Id": workspaceId,
          },
          body: JSON.stringify({
            collectionIds: newOrder.map((c) => c.id),
          }),
        });
      } catch {
        toast.error("Failed to save collection order");
        fetchCollections();
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-foreground text-2xl font-bold">Collections</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card overflow-hidden rounded-xl border">
              <Skeleton className="aspect-[16/10] w-full" />
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-foreground text-2xl font-bold">Collections</h1>

      {/* My Collections Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="shrink-0 text-lg font-semibold">My Collections</h2>
          {isPaid && (
            <div className="flex items-center gap-2">
              <div className="relative w-40 sm:w-48">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9"
                />
              </div>
              <div className="flex">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-r-none border-r-0"
                  onClick={() => setShowManageDialog(true)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Manage
                </Button>
                <Popover
                  open={showNewCollectionPopover}
                  onOpenChange={setShowNewCollectionPopover}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-l-none px-2"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">New Collection</h4>
                        <p className="text-muted-foreground text-xs">
                          Create a new collection to organize your quotes.
                        </p>
                      </div>
                      <Input
                        placeholder="Collection name..."
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateFromPopover();
                          }
                        }}
                        disabled={creatingCollection}
                        autoFocus
                      />
                      <Button
                        className="w-full"
                        onClick={handleCreateFromPopover}
                        disabled={
                          !newCollectionName.trim() || creatingCollection
                        }
                      >
                        {creatingCollection ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Create Collection
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>

        {collections.length === 0 && !isPaid ? (
          <div className="from-primary/10 via-primary/5 border-primary/20 to-background relative overflow-hidden rounded-xl border bg-gradient-to-tr p-6">
            <div className="relative z-10">
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                <div className="from-primary/20 to-primary/10 border-primary/20 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br">
                  <Lock className="text-primary h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold">
                    Unlock Custom Collections
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Upgrade to a paid plan to create custom collections and
                    organize your quotes your way.
                  </p>
                </div>
                <Link href={`/${workspaceSlug}/settings/billing`}>
                  <Button className="from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-primary/25 bg-gradient-to-r shadow-lg">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Upgrade
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-primary/5 absolute -right-4 -bottom-4 h-24 w-24 rounded-full blur-xl" />
          </div>
        ) : collections.length === 0 ? (
          <div className="from-primary/10 via-primary/5 to-background relative overflow-hidden rounded-xl border bg-gradient-to-tr p-6">
            <div className="relative z-10">
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                <div className="from-primary/20 to-primary/10 border-primary/20 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br">
                  <Inbox className="text-primary h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold">No collections yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Create custom collections to organize your quotes your way.
                  </p>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Collection
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">New Collection</h4>
                        <p className="text-muted-foreground text-xs">
                          Create a new collection to organize your quotes.
                        </p>
                      </div>
                      <Input
                        placeholder="Collection name..."
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateFromPopover();
                          }
                        }}
                        disabled={creatingCollection}
                        autoFocus
                      />
                      <Button
                        className="w-full"
                        onClick={handleCreateFromPopover}
                        disabled={
                          !newCollectionName.trim() || creatingCollection
                        }
                      >
                        {creatingCollection ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Create Collection
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="bg-primary/5 absolute -right-4 -bottom-4 h-24 w-24 rounded-full blur-xl" />
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No collections match &ldquo;{search}&rdquo;
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCollections.map((collection) => (
              <Link
                key={collection.id}
                href={`/${workspaceSlug}/collections/${collection.id}`}
                className="bg-card hover:border-primary/20 group cursor-pointer overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg"
              >
                {/* Cover Image */}
                <div className="bg-muted relative aspect-[16/10] overflow-hidden">
                  {collection.coverImage ? (
                    <img
                      src={collection.coverImage}
                      alt={collection.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="from-primary/10 to-primary/5 flex h-full w-full items-center justify-center bg-gradient-to-br">
                      {collection.emoji ? (
                        <span className="text-5xl">{collection.emoji}</span>
                      ) : (
                        <ImageIcon className="text-primary/40 h-12 w-12" />
                      )}
                    </div>
                  )}

                  {/* Count Badge */}
                  <div className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {collection.quoteCount}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    {collection.emoji ? (
                      <span className="shrink-0 text-base">
                        {collection.emoji}
                      </span>
                    ) : (
                      <FolderKanban className="text-primary h-4 w-4 shrink-0" />
                    )}
                    <h3 className="group-hover:text-primary truncate text-sm font-semibold transition-colors">
                      {collection.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Manage Collections Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="p-0 sm:max-w-[500px]">
          <div className="bg-muted/30 flex items-start gap-3 border-b px-6 py-4 pr-14">
            <div className="bg-primary/10 border-primary/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border">
              <FolderKanban className="text-primary h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">Manage Collections</h3>
              <p className="text-muted-foreground text-xs">
                Create, rename, or delete your custom collections.
              </p>
            </div>
          </div>

          <div className="space-y-6 p-6">
            {/* Create new collection */}
            <div>
              <label className="mb-3 block text-sm font-medium">
                Create New Collection
              </label>
              <div className="bg-muted/30 flex items-center gap-2 rounded-lg border px-2 py-2">
                <Input
                  placeholder="Collection name..."
                  value={manageNewName}
                  onChange={(e) => setManageNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateFromManageDialog();
                    }
                  }}
                  disabled={creatingCollection}
                  className="h-9 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                  size="sm"
                  className="h-9"
                  onClick={handleCreateFromManageDialog}
                  disabled={!manageNewName.trim() || creatingCollection}
                >
                  {creatingCollection ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Collections list */}
            <div>
              <label className="mb-3 block text-sm font-medium">
                Collections
              </label>
              <div className="bg-muted/30 max-h-[280px] overflow-y-auto rounded-lg border">
                {collections.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center text-sm">
                    No collections yet. Create one above to get started.
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={collections.map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="divide-y">
                        {collections.map((collection) => (
                          <SortableCollectionItem
                            key={collection.id}
                            collection={collection}
                            onDelete={handleDeleteCollection}
                            onUpdate={handleUpdateCollection}
                            isDeleting={deletingId === collection.id}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowManageDialog(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
