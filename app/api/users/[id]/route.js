import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 更新員工資訊
export async function PUT(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { name, email, phone, role, address, identityId, avatarUrl } = body;

        // 驗證必要欄位
        if (!name || !email || !role) {
            return NextResponse.json(
                { message: "缺少必要欄位" },
                { status: 400 }
            );
        }

        // 檢查用戶是否存在
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            return NextResponse.json(
                { message: "找不到該用戶" },
                { status: 404 }
            );
        }

        // 檢查 email 是否已被其他用戶使用
        const emailExists = await prisma.user.findFirst({
            where: {
                email,
                id: { not: id }
            }
        });

        if (emailExists) {
            return NextResponse.json(
                { message: "此信箱已經被其他用戶使用" },
                { status: 409 }
            );
        }

        // 更新用戶資訊
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                phone: phone || null,
                role,
                address: address || null,
                avatarUrl: avatarUrl || null
            }
        });

        return NextResponse.json({
            message: "用戶資訊已成功更新",
            user: updatedUser
        });
    } catch (error) {
        console.error("更新用戶資訊失敗:", error);
        return NextResponse.json(
            { message: "更新用戶資訊失敗", error: String(error) },
            { status: 500 }
        );
    }
}

// 刪除員工
export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        // 檢查用戶是否存在
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            return NextResponse.json(
                { message: "找不到該用戶" },
                { status: 404 }
            );
        }

        // 先刪除該用戶的所有訂單項目
        await prisma.orderItem.deleteMany({
            where: {
                order: {
                    customerId: id
                }
            }
        });

        // 刪除該用戶的所有訂單
        await prisma.order.deleteMany({
            where: {
                customerId: id
            }
        });

        // 最後刪除用戶
        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json(
            { message: "用戶已成功刪除" },
            { status: 200 }
        );
    } catch (error) {
        console.error("刪除用戶失敗:", error);
        return NextResponse.json(
            { message: "刪除用戶失敗", error: String(error) },
            { status: 500 }
        );
    }
} 