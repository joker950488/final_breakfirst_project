import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
    try {
        const { orderId } = params;
        console.log("收到的訂單 ID:", orderId);

        if (!orderId) {
            console.log("訂單 ID 缺失");
            return NextResponse.json(
                { message: "訂單 ID 是必需的" },
                { status: 400 }
            );
        }

        console.log("正在查詢訂單...");
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                customer: {
                    select: {
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

        console.log("查詢結果:", order);

        if (!order) {
            console.log("找不到訂單");
            return NextResponse.json(
                { message: "找不到訂單" },
                { status: 404 }
            );
        }

        // 格式化輸出
        const formattedOrder = {
            id: order.id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            completedAt: order.completedAt,
            customer: order.customer ? {
                name: order.customer.name || '未知',
                phone: order.customer.phone || '未知',
                address: order.customer.address || '未知'
            } : null,
            items: order.items.map(item => ({
                id: item.id,
                quantity: item.quantity,
                specialRequest: item.specialRequest || '',
                menuItem: {
                    name: item.menuItem?.name || '未知商品',
                    price: item.menuItem?.price || 0
                }
            }))
        };

        console.log("格式化後的訂單數據:", formattedOrder);
        return NextResponse.json(formattedOrder);
    } catch (error) {
        console.error("獲取訂單詳情失敗:", error);
        return NextResponse.json(
            { message: "伺服器錯誤", error: String(error) },
            { status: 500 }
        );
    }
} 