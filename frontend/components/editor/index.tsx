"use client";

import dynamic from "next/dynamic";
import Loading from "@/components/editor/loading";
import { Sandbox, User } from "@/lib/types";
import { useEffect, useState } from "react";
import { startServer } from "@/lib/utils";
import { toast } from "sonner";

const CodeEditor = dynamic(() => import("@/components/editor/editor"), {
  ssr: false,
  loading: () => <Loading />,
});

export default function Editor({
  userData,
  sandboxData,
}: {
  userData: User;
  sandboxData: Sandbox;
}) {
  const [isServerRunning, setIsServerRunning] = useState(false);

  // useEffect(() => {
  //   startServer(sandboxData.id, userData.id, (success: boolean) => {
  //     if (!success) {
  //       toast.error("Failed to start server.");
  //       return;
  //     }
  //     setIsServerRunning(true);
  //   });
  // }, []);

  if (!isServerRunning)
    return (
      <Loading text="Creating code editing environment, this could take a while." />
    );

  return <CodeEditor userData={userData} sandboxData={sandboxData} />;
}
