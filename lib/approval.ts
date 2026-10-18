import { prisma } from "./prisma";
import { loadPermissions } from "./permission";
import { loadSystemConfig } from "./system-config";

export async function checkApprovalRequired(role: string, actionKey: string): Promise<boolean> {
  // ROOT is always exempt
  if (role === "ROOT") return false;
  
  // Master Switch Check
  const config = await loadSystemConfig();
  if (!config.changeApprovalRequired) return false;

  const perms = await loadPermissions();
  // Construct the dynamic approval key (e.g., approval_can_edit_user_name)
  // Support both "can_xxx" and "approval_can_xxx" formats
  const approvalKey = actionKey.startsWith("approval_") ? actionKey : `approval_${actionKey}`;
  
  return !!perms[`${role.toLowerCase()}.${approvalKey}`];
}

export async function createPendingAction(
  type: string, 
  data: any, 
  requesterId: string
) {
  return await prisma.pendingAction.create({
    data: {
      type,
      data: data as any,
      requesterId,
      status: "PENDING"
    }
  });
}
