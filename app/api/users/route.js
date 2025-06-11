import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 獲取所有員工
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const rolesParam = searchParams.get("roles");

        let whereCondition = {};
        if (rolesParam) {
            const roles = rolesParam.split(",");
            whereCondition.role = { in: roles };
        }

        const users = await prisma.user.findMany({
            where: whereCondition,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                address: true,
                isActive: true,
                createdAt: true,
                avatarUrl: true
            }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("獲取員工列表失敗:", error);
        return NextResponse.json(
            { message: "獲取員工列表失敗" },
            { status: 500 }
        );
    }
}

// 新增員工
export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, password, role, phone, address } = body;

        // 驗證必要欄位
        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { message: "缺少必要欄位" },
                { status: 400 }
            );
        }

        // 檢查 email 是否已存在
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "此信箱已經被註冊" },
                { status: 409 }
            );
        }

        // 創建新員工
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password,
                role,
                phone,
                address,
                isActive: true
            }
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        console.error("創建員工失敗:", error);
        return NextResponse.json(
            { message: "創建員工失敗" },
            { status: 500 }
        );
    }
} 