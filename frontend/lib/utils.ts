import { type ClassValue, clsx } from "clsx";
// import { toast } from "sonner"
import { twMerge } from "tailwind-merge";
import { Sandbox, TFile, TFolder } from "./types";
import { Service } from "@aws-sdk/client-ecs";
import { describeService } from "./actions";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function processFileType(file: string) {
  const ending = file.split(".").pop();

  if (ending === "ts" || ending === "tsx") return "typescript";
  if (ending === "js" || ending === "jsx") return "javascript";

  if (ending) return ending;
  return "plaintext";
}

export function validateName(
  newName: string,
  oldName: string,
  type: "file" | "folder"
) {
  if (newName === oldName || newName.length === 0) {
    return { status: false, message: "" };
  }
  if (
    newName.includes("/") ||
    newName.includes("\\") ||
    newName.includes(" ") ||
    (type === "file" && !newName.includes(".")) ||
    (type === "folder" && newName.includes("."))
  ) {
    return { status: false, message: "Invalid file name." };
  }
  return { status: true, message: "" };
}

export function addNew(
  name: string,
  type: "file" | "folder",
  setFiles: React.Dispatch<React.SetStateAction<(TFolder | TFile)[]>>,
  sandboxData: Sandbox
) {
  if (type === "file") {
    setFiles((prev) => [
      ...prev,
      { id: `projects/${sandboxData.id}/${name}`, name, type: "file" },
    ]);
  } else {
    console.log("adding folder");
    setFiles((prev) => [
      ...prev,
      {
        id: `projects/${sandboxData.id}/${name}`,
        name,
        type: "folder",
        children: [],
      },
    ]);
  }
}

// export async function startServer(
//   sandboxId: string,
//   userId: string,
//   callback: (success: boolean) => void
// ) {
//   try {
//     const res = await fetch("http://localhost:4001/start", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         sandboxId,
//         userId,
//       }),
//     });

//     if (res.status !== 200) {
//       console.error("Failed to start server", res);
//       callback(false);
//     }

//     callback(true);
//   } catch (error) {
//     console.error("Failed to start server", error);

//     callback(false);
//   }
// }

export function checkServiceStatus(serviceName: string): Promise<Service> {
  return new Promise((resolve, reject) => {
    let tries = 0;

    const interval = setInterval(async () => {
      try {
        tries++;

        if (tries > 40) {
          clearInterval(interval);
          reject(new Error("Timed out."));
        }

        const response = await describeService(serviceName);
        const activeServices = response.services?.filter(
          (service) => service.status === "ACTIVE"
        );
        console.log("Checking activeServices status", activeServices);

        if (activeServices?.length === 1) {
          const service = activeServices?.[0];
          if (
            service.runningCount === service.desiredCount &&
            service.deployments?.length === 1
          ) {
            if (service.deployments[0].rolloutState === "COMPLETED") {
              clearInterval(interval);
              resolve(service);
            } else if (service.deployments[0].rolloutState === "FAILED") {
              clearInterval(interval);
              reject(new Error("Deployment failed."));
            }
          }
        }
      } catch (error: any) {
        clearInterval(interval);
        reject(error);
      }
    }, 3000);
  });
}
