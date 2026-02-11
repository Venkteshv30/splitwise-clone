// components/Profile.js
import React from "react";
import { Mail, LogOut, Moon, Sun, User } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { useTheme } from "../contexts/ThemeContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

const Profile = () => {
  const { currentUser } = useAppContext();
  const { theme, toggleTheme, isDark } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isGoogleMail = currentUser?.email?.toLowerCase().includes("@gmail.com");

  // Get initials from name or email
  const getInitials = () => {
    if (currentUser?.displayName) {
      const nameParts = currentUser.displayName.trim().split(" ");
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-3 sm:mb-4">
        <h2 className="text-sm sm:text-base font-semibold block mb-1 text-foreground">
          Profile
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Your account information
        </p>
      </div>

      {/* Profile Card */}
      <Card className="mb-3 sm:mb-4 border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center py-4 sm:py-6">
            {/* Profile Image */}
            <Avatar
              className={cn(
                "mb-3 sm:mb-4 h-20 w-20",
                isGoogleMail && "bg-blue-500"
              )}
            >
              <AvatarImage src={currentUser?.photoURL} />
              <AvatarFallback className="text-2xl">
                {!currentUser?.photoURL && getInitials()}
              </AvatarFallback>
            </Avatar>

            {/* Name */}
            <h3 className="mb-1 sm:mb-2 text-base sm:text-lg font-semibold text-foreground">
              {currentUser?.displayName ||
                currentUser?.email?.split("@")[0] ||
                "User"}
            </h3>

            {/* Email */}
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Mail className="text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                {currentUser?.email}
              </p>
            </div>

            {/* Google Badge */}
            {isGoogleMail && (
              <Badge variant="outline" className="mt-1 border-blue-500/30 text-blue-400">
                <svg
                  className="w-3 h-3 mr-1"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google Account
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="mb-3 sm:mb-4 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs sm:text-sm">Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
              <p className="text-xs sm:text-sm font-medium text-foreground">
                {currentUser?.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Toggle */}
      <Card className="mb-3 sm:mb-4 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs sm:text-sm">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isDark ? (
                <Moon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground" />
              )}
              <p className="text-xs sm:text-sm text-foreground">Theme</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="text-xs sm:text-sm"
            >
              {isDark ? (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  Dark Mode
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <div className="mt-4 sm:mt-6">
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="w-full text-xs sm:text-sm"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Profile;
