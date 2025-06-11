import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
    try {
        // 從請求頭中獲取用戶 ID
        const userId = request.headers.get("x-user-id");
        
        if (!userId) {
            return NextResponse.json(
                { message: "未登入" },
                { status: 401 }
            );
        }

        // 檢查用戶角色
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        if (!user) {
            return NextResponse.json(
                { message: "找不到用戶" },
                { status: 404 }
            );
        }

        if (user.role !== "CAPTAIN") {
            return NextResponse.json(
                { message: "只有外送員可以訪問此 API" },
                { status: 403 }
            );
        }

        // 獲取所有外送相關的訂單
        const orders = await prisma.order.findMany({
            where: {
                status: {
                    in: ["DELIVERING", "READY"] // 包含已準備好外送的訂單
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        address: true
                    }
                },
                captain: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                },
                items: {
                    include: {
                        menuItem: true
                    }
                }
            }
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error("獲取外送訂單失敗:", error);
        return NextResponse.json(
            { message: "伺服器錯誤", error: String(error) },
            { status: 500 }
        );
    }
} 