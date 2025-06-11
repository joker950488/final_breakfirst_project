import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get("customerId");

        if (!customerId) {
            return NextResponse.json(
                { message: "缺少必要參數" },
                { status: 400 }
            );
        }

        // 獲取已完成的訂單（COMPLETED 或 DELIVERED）
        const orders = await prisma.order.findMany({
            where: {
                customerId: customerId,
                status: {
                    in: ["COMPLETED", "DELIVERED"]
                }
            },
            orderBy: {
                createdAt: "desc"
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

        return NextResponse.json(orders);
    } catch (error) {
        console.error("獲取歷史訂單失敗:", error);
        return NextResponse.json(
            { message: "伺服器錯誤" },
            { status: 500 }
        );
    }
} 