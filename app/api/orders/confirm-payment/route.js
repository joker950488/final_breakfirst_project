import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { notifyOrderStatus } from "@/lib/mqttClient";

export async function POST(request) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId || typeof orderId !== "string") {
            return NextResponse.json(
                { message: "請提供有效的 orderId" },
                { status: 400 }
            );
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: true },
        });

        notifyOrderStatus(updatedOrder, "payment");

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error("確認付款失敗:", error);
        return NextResponse.json(
            { message: "伺服器錯誤", error: String(error) },
            { status: 500 }
        );
    }
}
