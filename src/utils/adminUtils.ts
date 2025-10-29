import { supabase } from "@/integrations/supabase/client";

// Utility function to make current user admin (DEVELOPMENT ONLY)
export const makeCurrentUserAdmin = async () => {
  // Only allow in development environment
  if (import.meta.env.PROD) {
    console.warn("🚫 Admin utilities are disabled in production for security");
    return false;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("❌ No authenticated user found");
      return false;
    }

    console.log("🔧 Making user admin:", user.email, user.id);

    // First, remove any existing roles to avoid conflicts
    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", user.id);

    // Insert admin role
    const { error } = await supabase
      .from("user_roles")
      .insert({
        user_id: user.id,
        role: "admin"
      });

    if (error) {
      console.error("❌ Error adding admin role:", error);
      return false;
    }

    console.log("✅ Admin role added successfully!");
    
    // Verify it worked
    const { data: isAdminData, error: verifyError } = await supabase
      .rpc("is_user_admin", { user_uuid: user.id });
    
    if (verifyError) {
      console.error("❌ Error verifying admin role:", verifyError);
      return false;
    }
    
    console.log("🔍 Admin verification result:", isAdminData);
    
    if (isAdminData) {
      console.log("🎉 SUCCESS! You are now an admin. Refresh the page to see changes.");
      return true;
    } else {
      console.error("❌ Admin role verification failed");
      return false;
    }
    
  } catch (error) {
    console.error("💥 Exception making user admin:", error);
    return false;
  }
};

// Make this available globally for console use (DEVELOPMENT ONLY)
if (typeof window !== 'undefined' && !import.meta.env.PROD) {
  (window as any).makeCurrentUserAdmin = makeCurrentUserAdmin;
  console.log("🛠️ Admin utility loaded! Use 'makeCurrentUserAdmin()' in console to grant admin access.");
}

export default makeCurrentUserAdmin;