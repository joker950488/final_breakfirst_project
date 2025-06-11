import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// import { getIO } from "@/lib/socket"; // 註解 Socket.io 相關的 import
import { notifyOrderStatus } from "@/lib/mqttClient";

export async function POST(req) {
    try {
        const { orderId, captainId, deliveryAddress, deliveryPhone } = await req.json();
        console.log("收到指派外送人員請求 - orderId:", orderId, "captainId:", captainId, "deliveryAddress:", deliveryAddress, "deliveryPhone:", deliveryPhone);

        if (!orderId || !captainId) {
            return NextResponse.json(
                { message: "缺少必要參數" },
                { status: 400 }
            );
        }

        // 檢查船長是否存在且角色正確
        const captain = await prisma.user.findFirst({
            where: {
                id: captainId,
                role: "CAPTAIN",
                isActive: true
            }
        });

        if (!captain) {
            return NextResponse.json(
                { message: "無效的派送人員" },
                { status: 400 }
            );
        }

        // 更新訂單
        const updated = await prisma.order.update({
            where: { id: orderId },
            data: {
                captainId,
                status: "DELIVERING",
                deliveryAddress: deliveryAddress || null,
                deliveryPhone: deliveryPhone || null
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
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

        console.log("成功更新訂單並指派外送人員:", updated.id);

        // 發送 WebSocket 通知 // 註解 Socket.io 相關程式碼
        // const io = getIO();
        // io.to(`order-${orderId}`).emit('order-assigned', {
        //     orderId,
        //     captain: captain,
        //     order: updated
        // });

        // 新增: 發送 MQTT 通知
        notifyOrderStatus(updated, "assign-captain");

        return NextResponse.json(updated);
    } catch (err) {
        console.error("指派派送人員失敗:", err);
        return NextResponse.json({ message: "伺服器錯誤" }, { status: 500 });
    }
} 