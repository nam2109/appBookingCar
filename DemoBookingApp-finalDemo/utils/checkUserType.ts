// utils/checkUserType.ts
import { db } from "@/lib/db"; // Giả sử bạn đã thiết lập kết nối database

export const checkUserType = async (userId: string) => {
  // Kiểm tra trong bảng driver trước
  const driver = await db.driver.findUnique({
    where: { clerkId: userId },
  });

  if (driver) return "driver";

  // Nếu không phải driver, kiểm tra trong bảng user
  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  return user ? "user" : null;
};
