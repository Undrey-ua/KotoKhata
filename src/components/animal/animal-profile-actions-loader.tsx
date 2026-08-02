"use client";

import { useEffect, useState } from "react";
import { getProfileSessionInfo } from "@/actions/session-info";
import { AnimalProfileActions } from "@/components/animal/animal-profile-actions";

type AnimalProfileActionsLoaderProps = {
  shelterSlug: string;
  animalSlug: string;
  animalName: string;
  monthlyGoal: number | null;
  minCuratorshipAmount: number | null;
};

export function AnimalProfileActionsLoader(props: AnimalProfileActionsLoaderProps) {
  const [session, setSession] = useState<{
    fullName: string | null;
    email: string;
  } | null>(null);

  useEffect(() => {
    void getProfileSessionInfo().then(setSession);
  }, []);

  return (
    <AnimalProfileActions
      {...props}
      isLoggedIn={session !== null}
      userFullName={session?.fullName}
      userEmail={session?.email}
    />
  );
}
