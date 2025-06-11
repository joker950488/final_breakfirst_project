"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notifyOrderStatus } from "@/lib/mqttClient";
import toast, { Toaster } from "react-hot-toast";
import mqtt from "mqtt";

const MQTT_BROKER_URL = process.env.NEXT_PUBLIC_MQTT_BROKER_URL || "wss://broker.emqx.io:8084/mqtt";
const MQTT_TOPIC = process.env.NEXT_PUBLIC_MQTT_TOPIC || "nuu/esic/breakfirst";

export default function KitchenPage() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mqttConnected, setMqttConnected] = useState(false);
    const [mqttClient, setMqttClient] = useState(null);

    useEffect(() => {
        // 檢查用戶是否已登入
        const userStr = sessionStorage.getItem("user");
        if (!userStr) {
            router.push("/login");
            return;
        }

        const user = JSON.parse(userStr);
        if (user.role !== "CHEF" && user.role !== "OWNER") {
            router.push("/login");
            return;
        }

        const fetchOrders = async () => {
            try {
                const response = await fetch("/api/orders/kitchen", {
                    headers: {
                        "x-user-id": user.id
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
                setLoading(false);
            }
        };

        fetchOrders();

        // 連接到 MQTT broker
        const client = mqtt.connect(MQTT_BROKER_URL);

        client.on("connect", () => {
            console.log("MQTT 已連接");
            setMqttConnected(true);
            client.subscribe(MQTT_TOPIC);
        });

        client.on("message", (topic, message) => {
            try {
                const orderUpdate = JSON.parse(message.toString());
                console.log("收到 MQTT 訊息:", orderUpdate);

                if (orderUpdate.type === "update" && orderUpdate.status === "PREPARING") {
                    // 當收到新訂單時，重新獲取訂單列表
                    fetchOrders();
                    // 顯示通知
                    toast.custom((t) => (
                        <div
                            className={`max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 border-l-4 border-green-500 ${t.visible ? 'animate-enter' : 'animate-leave'}`}
                        >
                            <div className="flex-1 w-0">
                                <p className="text-sm font-medium text-gray-900">
                                    新訂單通知
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    訂單編號：{orderUpdate.orderId}
                                </p>
                                <div className="mt-2 text-sm text-gray-700">
                                    {orderUpdate.order?.items?.map(item => (
                                        <div key={item.id}>
                                            {item.menuItem.name} × {item.quantity}
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-2 text-sm font-medium text-green-600">
                                    總金額：${orderUpdate.order?.totalAmount}
                                </p>
                            </div>
                        </div>
                    ), { duration: 5000 });
                } else if (orderUpdate.type === "update" && orderUpdate.status === "READY" || orderUpdate.status === "DELIVERED") {
                    // 訂單完成或已送達
                    setOrders(prev => prev.filter(order => order.id !== orderUpdate.orderId));
                }
            } catch (error) {
                console.error("處理 MQTT 訊息失敗:", error);
            }
        });

        client.on("error", (error) => {
            console.error("MQTT 錯誤:", error);
            setMqttConnected(false);
        });

        client.on("close", () => {
            console.log("MQTT 連接已關閉");
            setMqttConnected(false);
        });

        setMqttClient(client);

        return () => {
            if (client) {
                client.end();
            }
        };
    }, [router]);

    const handleCompleteOrder = async (orderId) => {
        try {
            const response = await fetch("/api/orders/update-status", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId,
                    status: "READY"
                })
            });

            if (!response.ok) {
                throw new Error("更新訂單狀態失敗");
            }

            // 從列表中移除已完成的訂單
            setOrders(prev => prev.filter(order => order.id !== orderId));
            toast.success(`訂單 #${orderId} 已完成製作！`);
        } catch (error) {
            console.error("更新訂單狀態失敗:", error);
            setError("更新訂單狀態失敗，請稍後再試");
            toast.error("更新訂單狀態失敗，請稍後再試");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">載入中...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center text-red-600">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <Toaster position="top-right" />
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">廚房訂單</h1>
                    <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${mqttConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600">
                            {mqttConnected ? 'MQTT 已連接' : 'MQTT 未連接'}
                        </span>
                    </div>
                </div>
                {orders.length === 0 ? (
                    <div className="text-center text-gray-500">
                        <p>目前沒有待處理的訂單</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xl font-semibold">訂單 #{order.id}</h2>
                                        <p className="text-gray-600">
                                            顧客: {order.customer.name}
                                        </p>
                                        <p className="text-gray-600">
                                            電話: {order.customer.phone}
                                        </p>
                                        {order.customer.address && (
                                            <p className="text-gray-600">
                                                地址: {order.customer.address}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleCompleteOrder(order.id)}
                                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                                    >
                                        完成製作
                                    </button>
                                </div>
                                <div className="border-t pt-4">
                                    <h3 className="font-semibold mb-2">訂單項目：</h3>
                                    <ul className="space-y-2">
                                        {order.items.map((item) => (
                                            <li key={item.id} className="flex justify-between">
                                                <span>
                                                    {item.menuItem.name} x {item.quantity}
                                                    {item.specialRequest && (
                                                        <span className="text-gray-500 ml-2">
                                                            (備註: {item.specialRequest})
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-gray-600">
                                                    ${item.menuItem.price * item.quantity}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                        <span className="font-semibold">總金額：</span>
                                        <span className="text-xl font-bold">${order.totalAmount}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
