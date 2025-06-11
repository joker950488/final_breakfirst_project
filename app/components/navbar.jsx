"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
    const { data: session } = useSession();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const oauthUser = session?.user;
        const sessionUser = sessionStorage.getItem("user");
        let userData;

        if (oauthUser) {
            // 如果是 Google 登入，將用戶數據存儲到 sessionStorage
            userData = {
                id: oauthUser.id,
                name: oauthUser.name,
                email: oauthUser.email,
                role: oauthUser.role || "CUSTOMER" // 預設為 CUSTOMER 角色
            };
            sessionStorage.setItem("user", JSON.stringify(userData));
        } else if (sessionUser) {
            try {
                userData = JSON.parse(sessionUser);
            } catch (error) {
                console.error("解析用戶數據失敗:", error);
            }
        }

        setUser(userData);

        // 監聽 storage 事件
        const handleStorageChange = () => {
            const updatedUser = sessionStorage.getItem("user");
            if (updatedUser) {
                try {
                    setUser(JSON.parse(updatedUser));
                } catch (error) {
                    console.error("解析用戶數據失敗:", error);
                }
            } else {
                setUser(null);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [session]);

    const handleLogout = async () => {
        // 清除 sessionStorage
        sessionStorage.removeItem("user");
        
        // 如果是 Google 登入，使用 NextAuth 的 signOut
        if (session) {
            await signOut({ redirect: false });
        }
        
        // 重新導向到首頁
        window.location.href = "/";
    };

    const getRoleLinks = () => {
        if (!user) return [];

        switch (user.role) {
            case "CUSTOMER":
                return [
                    { href: "/menu", name: "菜單" },
                    { href: "/orders", name: "我的訂單" },
                ];
            case "STAFF":
                return [
                    { href: "/orders/pending", name: "等待中的訂單" },
                    { href: "/orders/ready", name: "完成的訂單" },
                ];
            case "CHEF":
                return [{ href: "/kitchen", name: "廚房訂單" }];
            case "OWNER":
                return [
                    { href: "/admin/menu", name: "菜單管理" },
                    { href: "/admin/users", name: "使用者管理" },
                    { href: "/orders/pending", name: "等待中的訂單" },
                    { href: "/orders/completed", name: "完成的訂單" },
                    { href: "/kitchen", name: "廚房訂單" },
                ];
            default:
                return [];
        }
    };

    return (
        <nav className="sticky top-0 z-50 bg-gradient-to-r from-orange-400 via-pink-500 to-red-500 text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center overflow-x-auto">
                <Link
                    href="/"
                    className="text-2xl font-bold tracking-wide hover:opacity-90 transition-opacity duration-300"
                    aria-label="前往首頁"
                >
                    🍽 網路早餐訂餐系統
                </Link>

                <div className="flex flex-wrap items-center gap-4">
                    {user ? (
                        <>
                            {getRoleLinks().map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-white font-medium hover:underline hover:text-yellow-200 transition duration-300"
                                    aria-label={link.name}
                                >
                                    {link.name}
                                </Link>
                            ))}

                            <span className="hidden sm:inline-block font-semibold">
                                您好，{user.name}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="bg-white text-pink-600 font-semibold px-3 py-1.5 rounded-md hover:bg-gray-100 transition duration-300"
                                aria-label="登出帳號"
                            >
                                登出
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="bg-white text-pink-600 font-semibold px-3 py-1.5 rounded-md hover:bg-gray-100 transition duration-300"
                            aria-label="登入帳號"
                        >
                            登入
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
