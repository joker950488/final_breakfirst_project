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

        if (user.role !== "OWNER") {
            return NextResponse.json(
                { message: "只有老闆可以訪問此 API" },
                { status: 403 }
            );
        }

        // 獲取今天的日期範圍
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 獲取所有已完成的訂單（COMPLETED 或 DELIVERED）
        const orders = await prisma.order.findMany({
            where: {
                OR: [
                    {
                        status: "COMPLETED",
                        completedAt: {
                            gte: today,
                            lt: tomorrow
                        }
                    },
                    {
                        status: "DELIVERED",
                        deliveredAt: {
                            gte: today,
                            lt: tomorrow
                        }
                    }
                ],
                paymentStatus: true
            },
            orderBy: {
                completedAt: "desc"
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

        // 分別計算自取和外送的營業額
        const pickupOrders = orders.filter(order => order.status === "COMPLETED");
        const deliveryOrders = orders.filter(order => order.status === "DELIVERED");

        const pickupRevenue = pickupOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const deliveryRevenue = deliveryOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalRevenue = pickupRevenue + deliveryRevenue;

        // 格式化日期
        const formattedDate = today.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        return NextResponse.json({
            date: formattedDate,
            totalRevenue,
            pickupRevenue,
            deliveryRevenue,
            pickupOrders,
            deliveryOrders,
            orders
        });
    } catch (error) {
        console.error("獲取已完成訂單失敗:", error);
        return NextResponse.json(
            { message: "伺服器錯誤", error: String(error) },
            { status: 500 }
        );
    }
} 