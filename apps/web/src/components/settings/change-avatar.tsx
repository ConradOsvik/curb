import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { refreshSession } from "@/lib/server/session";
import { useTRPC } from "@/lib/trpc";

const ACCEPTED_TYPES = "image/png, image/jpeg, image/webp";

interface ChangeAvatarProps {
  currentImage: string | null | undefined;
  name: string;
}

export function ChangeAvatar({ currentImage, name }: ChangeAvatarProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const getUploadUrl = useMutation(
    trpc.user.getProfileImageUploadUrl.mutationOptions()
  );
  const confirmImage = useMutation(
    trpc.user.confirmProfileImage.mutationOptions()
  );

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { key, url } = await getUploadUrl.mutateAsync({
        contentType: file.type,
      });

      const uploadResponse = await fetch(url, {
        body: file,
        headers: { "Content-Type": file.type },
        method: "PUT",
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const { imageUrl } = await confirmImage.mutateAsync({
        storageKey: key,
      });

      return imageUrl;
    },
    onError: () => {
      setPreviewUrl(null);
      toast.error("Failed to upload avatar");
    },
    onSuccess: async () => {
      setPreviewUrl(null);
      toast.success("Avatar updated");
      await refreshSession();
      void router.invalidate();
    },
  });

  const regenMutation = useMutation({
    ...trpc.user.regenerateAvatar.mutationOptions(),
    onError: () => {
      toast.error("Failed to regenerate avatar");
    },
    onSuccess: async (data) => {
      setPreviewUrl(data.imageUrl);
      toast.success("Avatar regenerated");
      await refreshSession();
      void router.invalidate();
    },
  });

  const isPending = uploadMutation.isPending || regenMutation.isPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    uploadMutation.mutate(file);

    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const displayImage = previewUrl ?? currentImage ?? undefined;

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        <AvatarImage src={displayImage} alt={name} />
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            {uploadMutation.isPending ? "Uploading..." : "Change"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => regenMutation.mutate()}
            disabled={isPending}
            aria-label="Regenerate avatar"
          >
            <ArrowPathIcon
              className={`size-4 ${regenMutation.isPending ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG or WebP. Max 5MB.
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload avatar"
      />
    </div>
  );
}
