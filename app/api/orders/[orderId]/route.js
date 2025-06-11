import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(request, { params }) {
    try {
        const { orderId } = params;
        const userId = request.headers.get("x-user-id");

        if (!userId) {
            return NextResponse.json(
                { message: "未登入" },
                { status: 401 }
            );
        }

        // 檢查訂單是否存在且屬於該用戶
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                customerId: userId,
                status: "COMPLETED"  // 只允許刪除已完成的訂單
            }
        });

        if (!order) {
            return NextResponse.json(
                { message: "找不到訂單或無權限刪除" },
                { status: 404 }
            );
        }

        // 刪除訂單項目
        await prisma.orderItem.deleteMany({
            where: { orderId }
        });

        // 刪除訂單
        await prisma.order.delete({
            where: { id: orderId }
        });

        return NextResponse.json(
            { message: "訂單已成功刪除" },
            { status: 200 }
        );
    } catch (error) {
        console.error("刪除訂單失敗:", error);
        return NextResponse.json(
            { message: "伺服器錯誤", error: String(error) },
            { status: 500 }
        );
    }
} 