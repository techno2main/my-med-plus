import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  onLogout: () => void;
}

export function LogoutButton({ onLogout }: LogoutButtonProps) {
  return (
    <Button 
      variant="outline" 
      className="w-full border-danger text-danger hover:bg-danger hover:text-white"
      onClick={onLogout}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Déconnexion
    </Button>
  );
}
