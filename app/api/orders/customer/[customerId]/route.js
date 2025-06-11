import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { notifyOrderStatus } from "@/lib/mqttClient";

export async function GET(request, { params }) {
    try {
        const { customerId } = params;

        if (!customerId || typeof customerId !== "string") {
            return NextResponse.json(
                { message: "customerId 必須提供且為字串" },
                { status: 400 }
            );
        }

        const orders = await prisma.order.findMany({
            where: {
                customerId,
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                items: {
                    include: {
                        menuItem: {
                            select: {
                                name: true,
                                price: true,
                            },
                        },
                    },
                },
            },
        });

        // 格式化輸出（可以根據需求調整）
        const formattedOrders = orders.map((order) => ({
            id: order.id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            completedAt: order.completedAt,
            items: order.items.map((item) => ({
                id: item.id,
                menuItem: {
                    name: item.menuItem.name,
                    price: item.menuItem.price,
                },
                quantity: item.quantity,
                specialRequest: item.specialRequest || "",
            })),
        }));

        return NextResponse.json(formattedOrders);
    } catch (error) {
        console.error("取得訂單錯誤:", error);
        return NextResponse.json(
            { message: "伺服器錯誤", error: String(error) },
            { status: 500 }
        );
    }
}
export async function POST(request, { params }) {
    try {
        const body = await request.json();
        const { customerId } = await params;
        const { orderItems } = body;

        // 驗證 customerId
        if (!customerId || typeof customerId !== "string") {
            return NextResponse.json(
                { message: "customerId 是必填欄位，且需為字串" },
                { status: 400 }
            );
        }

        // 驗證 order 陣列
        if (!Array.isArray(orderItems) || orderItems.length === 0) {
            return NextResponse.json(
                { message: "order 為必填欄位，且需為非空陣列" },
                { status: 400 }
            );
        }

        // 驗證每個 orderItem 並查詢 menuItem 資料
        const menuItemIds = orderItems.map((item) => item.menuItemId);
        const menuItems = await prisma.menuItem.findMany({
            where: { id: { in: menuItemIds } },
        });

        if (menuItems.length !== orderItems.length) {
            return NextResponse.json(
                { message: "有無效的 menuItemId" },
                { status: 400 }
            );
        }

        // 建立 menuItemId -> price 映射
        const priceMap = Object.fromEntries(
            menuItems.map((item) => [item.id, item.price])
        );

        // 計算總金額
        let totalAmount = 0;
        for (const item of orderItems) {
            if (
                typeof item.menuItemId !== "string" ||
                typeof item.quantity !== "number"
            ) {
                return NextResponse.json(
                    {
                        message:
                            "每個項目需包含 menuItemId（字串）與 quantity（數字）",
                    },
                    { status: 400 }
                );
            }
            totalAmount += priceMap[item.menuItemId] * item.quantity;
        }

        // 建立 Order 與 OrderItems
        const neworderItems = await prisma.order.create({
            data: {
                customerId,
                totalAmount,
                items: {
                    create: orderItems.map((item) => ({
                        menuItemId: item.menuItemId,
                        quantity: item.quantity,
                        specialRequest: item.specialRequest || null,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        menuItem: true,
                    },
                },
            },
        });

        // 新增: 發送 MQTT 通知
        notifyOrderStatus(neworderItems, "create");

        return NextResponse.json(neworderItems, { status: 200 });
    } catch (error) {
        console.error("建立訂單錯誤:", error);
        return NextResponse.json(
            { message: "伺服器錯誤", error: String(error) },
            { status: 500 }
        );
    }
}
