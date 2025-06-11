import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
    try {
        // 從 URL 獲取外送員 ID
        const { searchParams } = new URL(request.url);
        const captainId = searchParams.get("captainId");

        if (!captainId) {
            return NextResponse.json(
                { message: "缺少外送員 ID" },
                { status: 400 }
            );
        }

        // 獲取該外送員的所有進行中訂單
        const orders = await prisma.order.findMany({
            where: {
                captainId: captainId,
                status: {
                    in: ["DELIVERING"] // 只獲取外送中的訂單
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
        console.error("獲取外送員訂單失敗:", error);
        return NextResponse.json(
            { message: "伺服器錯誤" },
            { status: 500 }
        );
    }
} 