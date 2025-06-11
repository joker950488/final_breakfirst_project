import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
    try {
        // 從請求頭中獲取用戶 ID
        const userId = request.headers.get("x-user-id");
        console.log("收到的用戶 ID:", userId);

        if (!userId) {
            return NextResponse.json(
                { message: "未登入" },
                { status: 401 }
            );
        }

        // 獲取該顧客的所有訂單
        const orders = await prisma.order.findMany({
            where: {
                customerId: userId
            },
            orderBy: {
                createdAt: "desc"
            },
            include: {
                items: {
                    include: {
                        menuItem: true
                    }
                }
            }
        });

        console.log("查詢到的訂單數量:", orders.length);
        return NextResponse.json(orders);
    } catch (error) {
        console.error("獲取顧客訂單失敗:", error);
        // 返回更詳細的錯誤信息
        return NextResponse.json(
            { 
                message: "伺服器錯誤", 
                error: error.message,
                stack: error.stack 
            },
            { status: 500 }
        );
    }
} 