"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function CaptainHistoryPage() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // 從 sessionStorage 獲取用戶信息
        const sessionUser = sessionStorage.getItem("user");
        if (sessionUser) {
            const userData = JSON.parse(sessionUser);
            setUser(userData);
        } else {
            router.push("/login");
        }
    }, [router]);

    useEffect(() => {
        if (user?.id) {
            getOrders();
        }
    }, [user]);

    const getOrders = async () => {
        try {
            const response = await fetch(`/api/orders/captain/history?captainId=${user.id}`);
            if (!response.ok) throw new Error('獲取歷史訂單失敗');
            const data = await response.json();
            setOrders(data);
        } catch (error) {
            console.error('獲取歷史訂單失敗:', error);
            toast.error('獲取歷史訂單失敗，請稍後再試');
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "PENDING":
                return "等待中";
            case "PREPARING":
                return "準備中";
            case "READY":
                return "待取餐";
            case "COMPLETED":
                return "已完成";
            case "CANCELLED":
                return "已取消";
            case "DELIVERING":
                return "外送中";
            case "DELIVERED":
                return "已送達";
            default:
                return status;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "COMPLETED":
                return "bg-green-100 text-green-800";
            case "DELIVERED":
                return "bg-blue-100 text-blue-800";
            case "CANCELLED":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 px-4 sm:px-6 py-8">
            <Toaster position="top-right" />
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        📜 歷史訂單
                    </h1>
                    <button
                        onClick={() => router.push("/captain")}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                    >
                        返回派送頁面
                    </button>
                </div>

                {orders.length === 0 ? (
                    <p className="text-gray-500 text-center sm:text-left">
                        目前沒有歷史訂單。
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
                                    <span className={`mt-2 sm:mt-0 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                        {getStatusText(order.status)}
                                    </span>
                                </div>

                                <div className="mb-4 space-y-2">
                                    {order.deliveryAddress && (
                                        <p className="text-gray-700">
                                            <strong>送餐地址：</strong> {order.deliveryAddress}
                                        </p>
                                    )}
                                    {order.deliveryPhone && (
                                        <p className="text-gray-700">
                                            <strong>聯絡電話：</strong> {order.deliveryPhone}
                                        </p>
                                    )}
                                    <p className="text-gray-700">
                                        <strong>總金額：</strong> ${order.totalAmount.toFixed(2)}
                                    </p>
                                    <p className="text-gray-700">
                                        <strong>付款狀態：</strong>
                                        <span className={order.paymentStatus ? "text-green-600" : "text-red-600"}>
                                            {order.paymentStatus ? "已付款" : "未付款"}
                                        </span>
                                    </p>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-semibold mb-2 text-gray-700">
                                        餐點內容：
                                    </h4>
                                    <ul className="space-y-2">
                                        {order.items.map((item) => (
                                            <li
                                                key={item.id}
                                                className="flex justify-between text-sm text-gray-600"
                                            >
                                                <span>
                                                    {item.menuItem.name} × {item.quantity}
                                                    {item.specialRequest && (
                                                        <span className="block text-xs text-gray-400">
                                                            備註：{item.specialRequest}
                                                        </span>
                                                    )}
                                                </span>
                                                <span>
                                                    ${(item.menuItem.price * item.quantity).toFixed(2)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 