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

        // 檢查用戶角色
        const user = await prisma.user.findUnique({
            where: { id: customerId },
            select: { role: true }
        });

        if (!user) {
            return NextResponse.json(
                { message: "找不到用戶" },
                { status: 404 }
            );
        }

        // 根據用戶角色決定查詢條件
        let whereCondition = {};
        
        if (user.role === "STAFF" || user.role === "OWNER") {
            // 如果是服務人員或老闆，獲取所有訂單
            whereCondition = {};
        } else {
            // 如果是顧客，只獲取自己的訂單
            whereCondition = { customerId };
        }

        const orders = await prisma.order.findMany({
            where: whereCondition,
            orderBy: {
                createdAt: "desc",
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
                                price: true,
                            },
                        },
                    },
                },
            },
        });

        // 格式化輸出
        const formattedOrders = orders.map((order) => ({
            id: order.id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            completedAt: order.completedAt,
            customer: order.customer,
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

        // 建立 menuItemId -> price 映射
        const priceMap = Object.fromEntries(
            menuItems.map((item) => [item.id, item.price])
        );

        // 過濾掉無效的訂單項目，只保留資料庫中存在的項目
        const validOrderItems = orderItems.filter(item => 
            menuItems.some(menuItem => menuItem.id === item.menuItemId)
        );
        console.log("後端 - 過濾後的 validOrderItems:", validOrderItems);

        // 如果過濾後沒有有效的訂單項目，則返回錯誤
        if (validOrderItems.length === 0) {
            return NextResponse.json(
                { message: "購物車中沒有有效的菜單項目" },
                { status: 400 }
            );
        }

        // 計算總金額
        let totalAmount = 0;
        for (const item of validOrderItems) {
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
        console.log("後端 - 計算後的 totalAmount:", totalAmount);

        // 建立 Order 與 OrderItems
        const createData = {
            customerId,
            totalAmount,
            items: {
                create: validOrderItems.map((item) => ({
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    specialRequest: item.specialRequest || null,
                })),
            },
        };
        console.log("後端 - 傳遞給 Prisma.create 的資料:", JSON.stringify(createData, null, 2));

        const neworderItems = await prisma.order.create({
            data: createData,
            include: {
                items: {
                    include: {
                        menuItem: true,
                    },
                },
            },
        });
        console.log("後端 - Prisma 建立的訂單物件:", neworderItems);

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
