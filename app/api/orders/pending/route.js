import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        if (!userId) {
            return new NextResponse(
                JSON.stringify({ error: "Missing userId query parameter" }),
                { status: 400 }
            );
        }

        // 查詢用戶角色
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!user) {
            return new NextResponse(
                JSON.stringify({ error: "User not found" }),
                { status: 404 }
            );
        }

        // 允許 STAFF 和 OWNER 訪問
        if (user.role !== "STAFF" && user.role !== "OWNER") {
            return new NextResponse(
                JSON.stringify({
                    error: "Access denied: Only staff and owner can access this API",
                }),
                { status: 403 }
            );
        }

        // 獲取所有 PENDING 訂單
        const orders = await prisma.order.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
            include: {
                customer: {
                    select: { 
                        id: true,
                        name: true,
                        phone: true,
                        address: true
                    },
                },
                items: {
                    include: {
                        menuItem: {
                            select: { 
                                name: true, 
                                price: true 
                            },
                        },
                    },
                },
            },
        });

        const formattedOrders = orders.map((order) => ({
            id: order.id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            customer: order.customer ? {
                id: order.customer.id,
                name: order.customer.name || '未知',
                phone: order.customer.phone || '未知',
                address: order.customer.address || '未知'
            } : {
                id: '未知',
                name: '未知',
                phone: '未知',
                address: '未知'
            },
            items: order.items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
                specialRequest: item.specialRequest || '',
                menuItem: {
                    name: item.menuItem?.name || '未知商品',
                    price: item.menuItem?.price || 0,
                },
            })),
        }));

        return new NextResponse(JSON.stringify(formattedOrders), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Failed to get pending orders:", error);
        return new NextResponse(
            JSON.stringify({ error: "Failed to fetch pending orders" }),
            { status: 500 }
        );
    }
}
