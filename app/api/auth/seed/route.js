import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
    try {
        // 先刪除所有相關聯的記錄以避免外來鍵約束問題
        await prisma.orderItem.deleteMany({}); // 刪除所有訂單項目
        await prisma.order.deleteMany({});    // 刪除所有訂單

        // 然後刪除所有現有用戶
        await prisma.user.deleteMany({}); // 刪除所有用戶

        // 創建測試帳號
        const testUsers = [
            {
                name: "測試顧客",
                email: "customer@test.com",
                password: "customer123",
                role: "CUSTOMER",
                phone: "0912345678",
                address: "台北市信義區信義路五段7號"
            },
            {
                name: "測試員工",
                email: "staff@test.com",
                password: "staff123",
                role: "STAFF",
                phone: "0923456789"
            },
            {
                name: "測試廚師",
                email: "chef@test.com",
                password: "chef123",
                role: "CHEF",
                phone: "0934567890"
            },
            {
                name: "測試老闆",
                email: "owner@test.com",
                password: "owner123",
                role: "OWNER",
                phone: "0945678901"
            },
            {
                name: "測試外送員",
                email: "captain@test.com",
                password: "captain123",
                role: "CAPTAIN",
                phone: "0956789012"
            }
        ];

        const createdUsers = await prisma.user.createMany({
            data: testUsers
        });

        return NextResponse.json({
            message: "測試帳號創建成功",
            count: createdUsers.count
        });
    } catch (error) {
        console.error("創建測試帳號失敗:", error);
        return NextResponse.json(
            { message: "創建測試帳號失敗", error: String(error) },
            { status: 500 }
        );
    }
} 