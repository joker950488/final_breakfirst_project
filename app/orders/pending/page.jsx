"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import mqtt from "mqtt";
// import { updateOrderStatus, confirmPayment } from "@/app/orders/actions";

export default function PendingOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [captains, setCaptains] = useState([]);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // const ordersData = [
    //     {
    //         id: "order101",
    //         status: "PENDING",
    //         paymentStatus: false,
    //         totalAmount: 75,
    //         createdAt: "2025-05-28T08:00:00Z",
    //         customer: {
    //             name: "陳小明",
    //         },
    //         items: [
    //             {
    //                 id: "item-a",
    //                 menuItem: {
    //                     name: "培根蛋餅",
    //                     price: 40,
    //                 },
    //                 quantity: 1,
    //                 specialRequest: "加辣",
    //             },
    //             {
    //                 id: "item-b",
    //                 menuItem: {
    //                     name: "紅茶（中）",
    //                     price: 15,
    //                 },
    //                 quantity: 2,
    //                 specialRequest: "",
    //             },
    //         ],
    //     },
    //     {
    //         id: "order102",
    //         status: "PENDING",
    //         paymentStatus: true,
    //         totalAmount: 90,
    //         createdAt: "2025-05-28T08:15:00Z",
    //         customer: {
    //             name: "林美麗",
    //         },
    //         items: [
    //             {
    //                 id: "item-c",
    //                 menuItem: {
    //                     name: "鐵板麵套餐",
    //                     price: 60,
    //                 },
    //                 quantity: 1,
    //                 specialRequest: "不要加蛋",
    //             },
    //             {
    //                 id: "item-d",
    //                 menuItem: {
    //                     name: "奶茶（大）",
    //                     price: 30,
    //                 },
    //                 quantity: 1,
    //                 specialRequest: "",
    //             },
    //         ],
    //     },
    //     {
    //         id: "order103",
    //         status: "PREPARING",
    //         paymentStatus: true,
    //         totalAmount: 120,
    //         createdAt: "2025-05-27T12:30:00Z",
    //         customer: {
    //             name: "王大華",
    //         },
    //         items: [
    //             {
    //                 id: "item-e",
    //                 menuItem: {
    //                     name: "招牌炒飯",
    //                     price: 80,
    //                 },
    //                 quantity: 1,
    //                 specialRequest: "",
    //             },
    //             {
    //                 id: "item-f",
    //                 menuItem: {
    //                     name: "冬瓜茶（大）",
    //                     price: 40,
    //                 },
    //                 quantity: 1,
    //                 specialRequest: "去冰",
    //             },
    //         ],
    //     },
    //     {
    //         id: "order104",
    //         status: "READY",
    //         paymentStatus: false,
    //         totalAmount: 50,
    //         createdAt: "2025-05-28T09:45:00Z",
    //         customer: {
    //             name: "李小美",
    //         },
    //         items: [
    //             {
    //                 id: "item-g",
    //                 menuItem: {
    //                     name: "蔥抓餅",
    //                     price: 50,
    //                 },
    //                 quantity: 1,
    //                 specialRequest: "不要加辣",
    //             },
    //         ],
    //     },
    //     {
    //         id: "order105",
    //         status: "CANCELLED",
    //         paymentStatus: false,
    //         totalAmount: 0,
    //         createdAt: "2025-05-26T15:00:00Z",
    //         customer: {
    //             name: "張志明",
    //         },
    //         items: [],
    //     },
    // ];

    useEffect(() => {
        const getPendingOrders = async () => {
            try {
                setIsLoading(true);
                let user;
                const sessionUser = sessionStorage.getItem("user");
                if (sessionUser) {
                    user = JSON.parse(sessionUser);
                }
                if (!user || (user.role !== "STAFF" && user.role !== "OWNER")) {
                    console.log("Access denied: Only staff and owner can access this page");
                    setError("只有員工和老闆可以查看此頁面");
                    setIsLoading(false);
                    return;
                }
                const response = await fetch(`/api/orders/pending?userId=${user.id}`);
                if (!response.ok) {
                    throw new Error("獲取訂單失敗");
                }
                const data = await response.json();
                setOrders(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("獲取訂單失敗:", err);
                setError(err.message);
                setOrders([]);
            } finally {
                setIsLoading(false);
            }
        };
        getPendingOrders();
        // setOrders(ordersData);
    }, []);

    useEffect(() => {
        const getCaptains = async () => {
            try {
                const response = await fetch('/api/users/captains');
                if (!response.ok) {
                    throw new Error("獲取派送人員失敗");
                }
                const data = await response.json();
                setCaptains(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('獲取派送人員失敗:', err);
                setCaptains([]); // 發生錯誤時設置為空陣列
            }
        };
        getCaptains();
    }, []);

    useEffect(() => {
        // MQTT 連線
        const MQTT_BROKER_URL = process.env.NEXT_PUBLIC_MQTT_BROKER_URL || "wss://broker.emqx.io:8084/mqtt";
        const MQTT_TOPIC = process.env.NEXT_PUBLIC_MQTT_TOPIC || "orders/status";
        const client = mqtt.connect(MQTT_BROKER_URL);
        client.on("connect", () => {
            client.subscribe(MQTT_TOPIC);
        });
        client.on("message", (topic, message) => {
            try {
                const orderUpdate = JSON.parse(message.toString());
                if (orderUpdate.type === "create") {
                    setOrders(prev => [orderUpdate.order, ...prev]);
                    toast.custom((t) => (
                        <div
                            className={`max-w-xs w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 p-4 border-l-4 border-pink-500 ${t.visible ? 'animate-enter' : 'animate-leave'}`}
                            onClick={() => setExpandedOrderId(orderUpdate.orderId)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="flex items-start">
                                <div className="flex-1 w-0">
                                    <p className="text-sm font-bold text-pink-700 mb-1">
                                        新訂單通知
                                    </p>
                                    <p className="text-xs text-gray-500 mb-1">
                                        訂單編號：{orderUpdate.orderId.slice(0, 8)}
                                    </p>
                                    <div className="text-xs text-gray-700">
                                        {orderUpdate.order?.items?.map(item => (
                                            <div key={item.id}>
                                                {item.menuItem?.name} × {item.quantity}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-blue-600 mt-2 underline">點擊查看詳細內容</p>
                                </div>
                            </div>
                        </div>
                    ), { duration: 4000 });
                }
            } catch (e) {
                console.error("處理 MQTT 訊息失敗:", e);
            }
        });
        return () => { client.end(); };
    }, []);

    const handleStatusChange = async (orderId, status) => {
        try {
            const response = await fetch("/api/orders/update-status", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId,
                    status,
                }),
            });

            if (!response.ok) {
                throw new Error("更新訂單狀態失敗");
            }

            // 更新訂單狀態並從列表中移除已開始製作的訂單
            setOrders((prev) =>
                prev.filter((order) => {
                    if (order.id === orderId && status === "PREPARING") {
                        return false; // 移除已開始製作的訂單
                    }
                    return true;
                })
            );
            toast.success("訂單狀態已更新");
        } catch (error) {
            console.error("更新訂單狀態失敗:", error);
            toast.error("更新訂單狀態失敗");
        }
    };

    const handlePaymentConfirm = async (orderId) => {
        try {
            const response = await fetch("/api/orders/update-status", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId,
                    paymentStatus: true,
                }),
            });

            if (!response.ok) {
                throw new Error("確認付款失敗");
            }

            // 更新訂單付款狀態
            setOrders((prev) =>
                prev.map((order) =>
                    order.id === orderId
                        ? { ...order, paymentStatus: true }
                        : order
                )
            );
            toast.success("付款已確認");
        } catch (error) {
            console.error("確認付款失敗:", error);
            toast.error("確認付款失敗");
        }
    };

    const handleAssignCaptain = async (orderId, captainId) => {
        try {
            const response = await fetch('/api/orders/assign-captain', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId, captainId }),
            });

            if (!response.ok) {
                throw new Error('指派派送人員失敗');
            }

            // 更新訂單狀態
            setOrders(prev => prev.filter(order => order.id !== orderId));
            toast.success("已指派派送人員");
        } catch (error) {
            console.error('指派派送人員失敗:', error);
            toast.error("指派派送人員失敗");
        }
    };

    function getStatusText(status) {
        switch (status) {
            case "PENDING": return "待處理";
            case "PREPARING": return "製作中";
            case "READY": return "準備完成";
            case "COMPLETED": return "已完成";
            case "CANCELLED": return "已取消";
            case "DELIVERING": return "外送中";
            case "DELIVERED": return "已送達";
            default: return status;
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-gray-600">載入中...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-red-600">錯誤：{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 px-4 sm:px-6 py-8">
            <Toaster position="top-right" />
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-center sm:text-left text-gray-800">
                    等待中的訂單
                </h1>

                {orders.length === 0 ? (
                    <p className="text-gray-500 text-center sm:text-left">
                        目前沒有任何等待中的訂單。
                    </p>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            訂單 #{order.id.slice(-6)}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                                        {getStatusText(order.status)}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="border-t pt-3">
                                        <h4 className="font-medium text-gray-700 mb-2">
                                            顧客資訊：
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            姓名：{order.customer?.name || "未知"}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            電話：{order.customer?.phone || "未知"}
                                        </p>
                                        {order.customer?.address && (
                                            <p className="text-sm text-gray-600">
                                                地址：{order.customer.address}
                                            </p>
                                        )}
                                    </div>

                                    <div className="border-t pt-3">
                                        <h4 className="font-medium text-gray-700 mb-2">
                                            餐點內容：
                                        </h4>
                                        <ul className="space-y-2">
                                            {order.items.map((item) => (
                                                <li
                                                    key={item.id}
                                                    className="flex justify-between text-sm"
                                                >
                                                    <span className="text-gray-600">
                                                        {item.menuItem.name} × {item.quantity}
                                                        {item.specialRequest && (
                                                            <span className="ml-2 text-xs text-gray-400">
                                                                ({item.specialRequest})
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-gray-800">
                                                        ${(item.menuItem.price * item.quantity).toFixed(2)}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="border-t pt-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-700">
                                                總金額：
                                            </span>
                                            <span className="text-lg font-bold text-gray-900">
                                                ${order.totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {!order.paymentStatus && (
                                        <button
                                            onClick={() => handlePaymentConfirm(order.id)}
                                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                                        >
                                            確認付款
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleStatusChange(order.id, "PREPARING")}
                                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                                    >
                                        開始製作
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(order.id, "CANCELLED")}
                                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                                    >
                                        取消訂單
                                    </button>
                                </div>

                                {/* 展開詳細內容的 Modal */}
                                {expandedOrderId === order.id && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                                        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">
                                            <button
                                                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
                                                onClick={() => setExpandedOrderId(null)}
                                            >
                                                ×
                                            </button>
                                            <h2 className="text-xl font-bold mb-4 text-pink-700">訂單詳細內容</h2>
                                            <div className="mb-2 text-gray-700">
                                                <strong>訂單編號：</strong>{order.id}
                                            </div>
                                            <div className="mb-2 text-gray-700">
                                                <strong>狀態：</strong>{getStatusText(order.status)}
                                            </div>
                                            <div className="mb-2 text-gray-700">
                                                <strong>建立時間：</strong>{new Date(order.createdAt).toLocaleString()}
                                            </div>
                                            <div className="mb-2 text-gray-700">
                                                <strong>總金額：</strong>${order.totalAmount.toFixed(2)}
                                            </div>
                                            <div className="mb-2 text-gray-700">
                                                <strong>付款狀態：</strong>{order.paymentStatus ? '已付款' : '未付款'}
                                            </div>
                                            <div className="mb-2 text-gray-700">
                                                <strong>餐點內容：</strong>
                                                <ul className="list-disc pl-5 mt-1">
                                                    {order.items.map(item => (
                                                        <li key={item.id}>
                                                            {item.menuItem?.name} × {item.quantity}
                                                            {item.specialRequest && (
                                                                <span className="ml-2 text-xs text-gray-400">備註：{item.specialRequest}</span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
