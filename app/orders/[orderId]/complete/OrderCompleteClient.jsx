"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function OrderCompleteClient({ orderId }) {
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getOrder = async () => {
            if (!orderId) {
                console.error("訂單 ID 未提供");
                toast.error("訂單 ID 未提供");
                setLoading(false);
                return;
            }

            try {
                console.log("正在獲取訂單，ID:", orderId);
                const response = await fetch(`/api/orders/${orderId}`);
                console.log("API 響應狀態:", response.status);
                
                const data = await response.json();
                console.log("API 響應數據:", data);
                
                if (!response.ok) {
                    throw new Error(data.message || "獲取訂單失敗");
                }
                
                if (!data || !data.id) {
                    console.error("無效的訂單數據:", data);
                    throw new Error("無效的訂單數據");
                }
                
                setOrder(data);
            } catch (error) {
                console.error("獲取訂單失敗:", error);
                toast.error(error.message || "獲取訂單失敗");
            } finally {
                setLoading(false);
            }
        };

        getOrder();
    }, [orderId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">載入中...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">找不到訂單</h2>
                    <button
                        onClick={() => router.push("/orders")}
                        className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                    >
                        返回訂單列表
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 px-4 py-8">
            <Toaster position="top-right" />
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">訂單已完成</h1>
                        <p className="text-gray-600">感謝您的訂購！</p>
                    </div>

                    <div className="space-y-4">
                        <div className="border-b pb-4">
                            <h2 className="text-lg font-semibold text-gray-800 mb-2">訂單詳情</h2>
                            <p className="text-gray-600">訂單編號：{order.id}</p>
                            <p className="text-gray-600">訂單時間：{new Date(order.createdAt).toLocaleString()}</p>
                            <p className="text-gray-600">總金額：${order.totalAmount.toFixed(2)}</p>
                            {order.customer && (
                                <>
                                    <p className="text-gray-600">顧客姓名：{order.customer.name}</p>
                                    <p className="text-gray-600">聯絡電話：{order.customer.phone}</p>
                                    <p className="text-gray-600">送餐地址：{order.customer.address}</p>
                                </>
                            )}
                        </div>

                        <div className="border-b pb-4">
                            <h2 className="text-lg font-semibold text-gray-800 mb-2">訂購項目</h2>
                            <div className="space-y-2">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-800">{item.menuItem.name}</p>
                                            <p className="text-sm text-gray-500">數量：{item.quantity}</p>
                                            {item.specialRequest && (
                                                <p className="text-sm text-gray-500">備註：{item.specialRequest}</p>
                                            )}
                                        </div>
                                        <p className="text-gray-800">${(item.menuItem.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={() => router.push("/orders")}
                                className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                            >
                                返回訂單列表
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 