"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";

export default function LoginPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 檢查是否已經登入
    useEffect(() => {
        if (session?.user) {
            const userData = {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                role: session.user.role
            };
            sessionStorage.setItem("user", JSON.stringify(userData));
            
            if (userData.role === "CAPTAIN") {
                router.push("/captain");
            } else if (userData.role === "STAFF") {
                router.push("/orders/ready");
            } else if (userData.role === "CUSTOMER") {
                router.push("/menu");
            } else {
                router.push("/");
            }
        } else {
            const user = sessionStorage.getItem("user");
            if (user) {
                const userData = JSON.parse(user);
                if (userData.role === "CAPTAIN") {
                    router.push("/captain");
                } else if (userData.role === "STAFF") {
                    router.push("/orders/ready");
                } else if (userData.role === "CUSTOMER") {
                    router.push("/menu");
                } else {
                    router.push("/");
                }
            }
        }
    }, [session, router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        const { email, password } = formData;

        if (!email || !password) {
            setError("所有欄位皆為必填");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "登入失敗");

            const user = data.user;
            sessionStorage.setItem("user", JSON.stringify(user));
            
            if (user.role === "CAPTAIN") {
                router.push("/captain");
            } else if (user.role === "STAFF") {
                router.push("/orders/ready");
            } else if (user.role === "CUSTOMER") {
                router.push("/menu");
            } else {
                router.push("/");
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await signIn("google", { 
                callbackUrl: "/menu",
                redirect: true
            });
        } catch (error) {
            console.error("Google 登入失敗:", error);
            setError("Google 登入失敗，請稍後再試");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">歡迎回來</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        請登入您的帳號
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <InputField
                            label="電子郵件"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <InputField
                            label="密碼"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-400 via-pink-500 to-red-500 hover:from-orange-500 hover:via-pink-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            {isSubmitting ? "登入中..." : "登入"}
                        </button>
                    </div>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">或</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-300"
                    >
                        <Image
                            src="/google.png"
                            alt="Google"
                            width={24}
                            height={24}
                        />
                        使用 Google 登入
                    </button>
                </div>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        還沒有帳號？{" "}
                        <Link
                            href="/register"
                            className="font-medium text-pink-600 hover:text-pink-500"
                        >
                            立即註冊
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

function InputField({ label, name, type, value, onChange }) {
    return (
        <div>
            <label
                htmlFor={name}
                className="block text-sm font-medium text-gray-700"
            >
                {label}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                required
                value={value}
                onChange={onChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
            />
        </div>
    );
}
