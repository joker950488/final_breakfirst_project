"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";

export default function ReadyOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user || user.role !== "STAFF") {
            router.push("/login");
            return;
        }
        getReadyOrders(user.id);
    }, [router]);

    const getReadyOrders = async (userId) => {
        try {
            const response = await fetch("/api/orders/ready", {
                headers: {
                    "x-user-id": userId
                }
            });
            if (!response.ok) {
                throw new Error("獲取訂單失敗");
            }
            const data = await response.json();
            setOrders(data);
        } catch (error) {
            console.error("獲取訂單失敗:", error);
            setError("獲取訂單失敗，請稍後再試");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 px-4 sm:px-6 py-8">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center">
                        <p className="text-gray-600">載入中...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 px-4 sm:px-6 py-8">
            <Toaster position="top-right" />
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-center sm:text-left text-gray-800">
                    已處理完成訂單
                </h1>

                {orders.length === 0 ? (
                    <p className="text-gray-500 text-center sm:text-left">
                        目前沒有已處理完成的訂單。
                    </p>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                            >
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">
                                            訂單 #{order.id.slice(0, 8)}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span
                                            className={`mt-2 sm:mt-0 px-3 py-1 rounded-full text-xs font-medium ${
                                                order.paymentStatus
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {order.paymentStatus ? "已付款" : "未付款"}
                                        </span>
                                    </div>
                                </div>

                                    <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-semibold text-gray-700">訂單內容</h4>
                                        <span className="text-lg font-bold text-gray-900">
                                            NT$ {order.totalAmount}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {order.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex justify-between items-center"
                                            >
                                                <div>
                                                    <p className="text-gray-800">
                                                        {item.menuItem.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        數量: {item.quantity}
                                                    </p>
                                                    {item.specialRequest && (
                                                        <p className="text-sm text-gray-500">
                                                            備註: {item.specialRequest}
                                                        </p>
                                                    )}
                                                </div>
                                                <p className="text-gray-700">
                                                    NT$ {item.menuItem.price * item.quantity}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 