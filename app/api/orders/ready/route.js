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

        if (user.role !== "STAFF") {
            return NextResponse.json(
                { message: "只有服務人員可以訪問此 API" },
                { status: 403 }
            );
        }

        // 獲取所有狀態為 READY 的訂單
        const orders = await prisma.order.findMany({
            where: {
                status: "READY"
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
                items: {
                    include: {
                        menuItem: {
                            select: {
                                name: true,
                                price: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error("獲取已處理完成訂單失敗:", error);
        return NextResponse.json(
            { message: "伺服器錯誤", error: String(error) },
            { status: 500 }
        );
    }
} 