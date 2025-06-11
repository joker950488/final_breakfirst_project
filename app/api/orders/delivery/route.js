import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
    try {
        // 獲取所有外送中的訂單
        const orders = await prisma.order.findMany({
            where: {
                status: "DELIVERING"
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
        console.error("獲取外送訂單失敗:", error);
        return NextResponse.json(
            { message: "伺服器錯誤" },
            { status: 500 }
        );
    }
} 