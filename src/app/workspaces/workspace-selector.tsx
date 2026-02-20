"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";

interface Workspace {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  role: string;
}

export function WorkspaceSelector({
  workspaces,
  userName,
}: {
  workspaces: Workspace[];
  userName?: string | null;
}) {
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const handleSelect = (slug: string) => {
    setSelectedSlug(slug);
    router.push(`/${slug}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafaf8]">
      <div className="w-full max-w-lg px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-[#1A1A1A]">
            Select a Workspace
          </h1>
          <p className="text-sm text-neutral-500">
            {userName ? `Welcome back, ${userName}.` : "Welcome back."} Choose a
            workspace to continue.
          </p>
        </div>

        <div className="space-y-3">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => handleSelect(ws.slug)}
              disabled={selectedSlug !== null}
              className="flex w-full items-center gap-3 rounded-lg border-2 border-[#1A1A1A] bg-white px-4 py-3 shadow-[2px_2px_0px_0px_#1A1A1A] transition-shadow hover:shadow-[3px_3px_0px_0px_#1A1A1A] disabled:opacity-60"
            >
              {ws.icon ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={ws.icon}
                  alt={ws.name}
                  className="h-10 w-10 rounded-lg"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-200 text-sm font-bold text-neutral-600">
                  {ws.name[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 text-left">
                <div className="font-semibold text-[#1A1A1A]">{ws.name}</div>
                <div className="text-xs text-neutral-500">/{ws.slug}</div>
              </div>
              {selectedSlug === ws.slug ? (
                <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-neutral-400" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
