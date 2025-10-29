import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useAthlete = () => {
  const [isAthlete, setIsAthlete] = useState(false);
  const [athleteData, setAthleteData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAthleteStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAthleteStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAthleteStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsAthlete(false);
        setAthleteData(null);
        setIsLoading(false);
        return;
      }

      // Check if user has an athlete profile
      const { data: athlete, error } = await supabase
        .from("athletes")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error || !athlete) {
        setIsAthlete(false);
        setAthleteData(null);
      } else {
        setIsAthlete(true);
        setAthleteData(athlete);
      }
    } catch (error) {
      console.error("Error checking athlete status:", error);
      setIsAthlete(false);
      setAthleteData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAthlete(false);
    setAthleteData(null);
    navigate("/");
  };

  return { isAthlete, athleteData, isLoading, logout, refresh: checkAthleteStatus };
};
