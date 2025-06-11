import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
    try {
        // 確保 params 被正確解析
        const customerId = await Promise.resolve(params.customerId);
        console.log("正在獲取訂單，客戶ID:", customerId);

        if (!customerId) {
            console.log("缺少客戶ID");
            return NextResponse.json(
                { message: "缺少客戶ID" },
                { status: 400 }
            );
        }

        // 檢查客戶是否存在
        const customer = await prisma.user.findUnique({
            where: { id: customerId }
        });

        if (!customer) {
            console.log("找不到客戶:", customerId);
            return NextResponse.json(
                { message: "找不到客戶" },
                { status: 404 }
            );
        }

        // *** 暫時修改：獲取客戶的所有訂單，不限狀態 ***
        const orders = await prisma.order.findMany({
            where: {
                customerId: customerId,
                // status: {
                //     in: ["PENDING", "PREPARING", "READY", "COMPLETED", "DELIVERED"]
                // }
            },
            orderBy: {
                createdAt: "desc"
            },
            include: {
                items: {
                    include: {
                        menuItem: true
                    }
                },
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                }
            }
        });

        console.log("獲取到的訂單數量 (所有狀態):", orders.length);
        console.log("訂單詳情 (所有狀態):", JSON.stringify(orders, null, 2));
        
        return NextResponse.json(orders);
    } catch (error) {
        console.error("獲取訂單失敗:", error);
        return NextResponse.json(
            { message: "獲取訂單失敗", error: String(error) },
            { status: 500 }
        );
    }
} 