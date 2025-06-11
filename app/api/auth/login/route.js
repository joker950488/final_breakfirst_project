// /api/auth/login/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // 驗證欄位
        if (!email || typeof email !== "string") {
            return NextResponse.json(
                { message: "email 是必填欄位" },
                { status: 400 }
            );
        }

        if (!password || typeof password !== "string") {
            return NextResponse.json(
                { message: "password 是必填欄位" },
                { status: 400 }
            );
        }

        // 查詢使用者
        const user = await prisma.user.findUnique({
            where: { email },
        });

        console.log("查詢到的使用者:", user); // 加入日誌

        if (!user) {
            console.log("找不到使用者:", email); // 加入日誌
            return NextResponse.json(
                { message: "帳號或密碼錯誤" },
                { status: 401 }
            );
        }

        if (user.password !== password) {
            console.log("密碼不匹配"); // 加入日誌
            return NextResponse.json(
                { message: "帳號或密碼錯誤" },
                { status: 401 }
            );
        }

        // 回傳登入成功
        return NextResponse.json(
            {
                message: "登入成功",
                user: { 
                    id: user.id, 
                    role: user.role, 
                    name: user.name,
                    email: user.email 
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("登入失敗:", error);
        return NextResponse.json(
            { message: "伺服器錯誤", error: String(error) },
            { status: 500 }
        );
    }
}
