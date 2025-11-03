import { AvatarWithBadge } from "@/components/ui/avatar-with-badge";
import { Button } from "@/components/ui/button";
import { Camera, Edit } from "lucide-react";
import { getInitials } from "../utils/profileUtils";

interface ProfileHeaderProps {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  isAdmin: boolean;
  isEditing: boolean;
  onEditClick: () => void;
  onAvatarClick: () => void;
}

export function ProfileHeader({
  firstName,
  lastName,
  email,
  avatarUrl,
  isAdmin,
  isEditing,
  onEditClick,
  onAvatarClick,
}: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="relative group shrink-0">
        <AvatarWithBadge
          src={avatarUrl || undefined}
          alt="Avatar"
          fallback={
            <span className="bg-gradient-to-br from-green-400 to-green-600 text-white text-base sm:text-lg font-semibold h-full w-full flex items-center justify-center">
              {getInitials(firstName, lastName)}
            </span>
          }
          isAdmin={isAdmin}
          className="h-14 w-14 sm:h-16 sm:w-16"
        />
        {isEditing && (
          <button
            onClick={onAvatarClick}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera className="h-5 w-5 text-white" />
          </button>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-lg sm:text-xl font-semibold truncate">{firstName} {lastName}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground truncate">{email}</p>
      </div>
      {!isEditing && (
        <Button variant="outline" size="sm" onClick={onEditClick} className="shrink-0">
          <Edit className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Modifier</span>
        </Button>
      )}
    </div>
  );
}
