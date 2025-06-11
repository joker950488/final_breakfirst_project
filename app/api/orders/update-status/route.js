import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { notifyOrderStatus } from "@/lib/mqttClient";

export async function POST(request) {
    try {
        const body = await request.json();
        const { orderId, status } = body;

        if (!orderId || !status) {
            return NextResponse.json(
                { message: "缺少必要參數" },
                { status: 400 }
            );
        }

        const validStatuses = ["PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED", "DELIVERING", "DELIVERED"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { message: "無效的訂單狀態" },
                { status: 400 }
            );
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { 
                status,
                ...(status === "COMPLETED" && { 
                    completedAt: new Date(),
                    paymentStatus: true  // 確認自取時將付款狀態設為已付款
                }),
                ...(status === "DELIVERED" && { 
                    deliveredAt: new Date(), 
                    paymentStatus: true 
                })
            },
            include: {
                customer: true,
                items: {
                    include: {
                        menuItem: true
                    }
                }
            }
        });

        notifyOrderStatus(updatedOrder, "update");

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error("更新訂單狀態失敗:", error);
        return NextResponse.json(
            { message: "伺服器錯誤", error: String(error) },
            { status: 500 }
        );
    }
}
