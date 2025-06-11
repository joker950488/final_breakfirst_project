"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import mqtt from "mqtt";

const MQTT_BROKER_URL = process.env.NEXT_PUBLIC_MQTT_BROKER_URL || "wss://broker.emqx.io:8084/mqtt";
const MQTT_TOPIC = process.env.NEXT_PUBLIC_MQTT_TOPIC || "nuu/esic/breakfirst";

export default function CompletedOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [pickupOrders, setPickupOrders] = useState([]);
    const [deliveryOrders, setDeliveryOrders] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [pickupRevenue, setPickupRevenue] = useState(0);
    const [deliveryRevenue, setDeliveryRevenue] = useState(0);
    const [date, setDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mqttClient, setMqttClient] = useState(null);

    // 獲取訂單數據
    const fetchCompletedOrders = async (userId) => {
        try {
            const response = await fetch("/api/orders/completed", {
                headers: {
                    "x-user-id": userId
                }
            });
            
            if (!response.ok) {
                throw new Error("獲取訂單失敗");
            }
            
            const data = await response.json();
            setOrders(data.orders);
            setPickupOrders(data.pickupOrders);
            setDeliveryOrders(data.deliveryOrders);
            setTotalRevenue(data.totalRevenue);
            setPickupRevenue(data.pickupRevenue);
            setDeliveryRevenue(data.deliveryRevenue);
            setDate(data.date);
        } catch (error) {
            console.error("獲取訂單失敗:", error);
            setError("獲取訂單失敗，請稍後再試");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // 檢查用戶是否已登入
        const userStr = sessionStorage.getItem("user");
        if (!userStr) {
            router.push("/login");
            return;
        }

        const user = JSON.parse(userStr);
        if (user.role !== "OWNER") {
            router.push("/login");
            return;
        }

        // 獲取初始數據
        fetchCompletedOrders(user.id);

        // 連接 MQTT
        const client = mqtt.connect(MQTT_BROKER_URL);

        client.on("connect", () => {
            console.log("已連接到 MQTT broker");
            client.subscribe(MQTT_TOPIC);
        });

        client.on("message", (topic, message) => {
            try {
                const data = JSON.parse(message.toString());
                // 當收到訂單狀態更新時，重新獲取數據
                if (data.type === "update" && 
                    (data.order.status === "COMPLETED" || data.order.status === "DELIVERED")) {
                    fetchCompletedOrders(user.id);
                }
            } catch (error) {
                console.error("解析 MQTT 訊息失敗:", error);
            }
        });

        client.on("error", (error) => {
            console.error("MQTT 錯誤:", error);
        });

        setMqttClient(client);

        // 清理函數
        return () => {
            if (client) {
                client.end();
            }
        };
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-4 text-gray-600">載入中...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">錯誤！</strong>
                        <span className="block sm:inline"> {error}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h1 className="text-2xl font-bold mb-4">今日營業報表</h1>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">日期</p>
                            <p className="text-xl font-semibold">{date}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">自取營業額</p>
                            <p className="text-xl font-semibold">${pickupRevenue}</p>
                            <p className="text-sm text-gray-500">{pickupOrders.length} 筆訂單</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">外送營業額</p>
                            <p className="text-xl font-semibold">${deliveryRevenue}</p>
                            <p className="text-sm text-gray-500">{deliveryOrders.length} 筆訂單</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">總營業額</p>
                            <p className="text-xl font-semibold">${totalRevenue}</p>
                            <p className="text-sm text-gray-500">{orders.length} 筆訂單</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold mb-4">已完成訂單列表</h2>
                    {orders.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">今日尚無已完成訂單</p>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div key={order.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-semibold">訂單編號：{order.id}</p>
                                            <p className="text-sm text-gray-600">
                                                完成時間：{new Date(order.completedAt || order.deliveredAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">總金額：${order.totalAmount}</p>
                                            <p className="text-sm text-gray-600">
                                                狀態：{order.status === "COMPLETED" ? "自取完成" : "外送完成"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-sm font-medium">顧客資訊：</p>
                                        <p className="text-sm text-gray-600">
                                            姓名：{order.customer.name}
                                            <br />
                                            電話：{order.customer.phone}
                                            <br />
                                            地址：{order.customer.address}
                                        </p>
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-sm font-medium">訂單內容：</p>
                                        <ul className="mt-1 space-y-1">
                                            {order.items.map((item) => (
                                                <li key={item.id} className="text-sm text-gray-600">
                                                    {item.menuItem.name} × {item.quantity}
                                                    {item.specialRequest && (
                                                        <span className="text-gray-500 ml-2">
                                                            (備註: {item.specialRequest})
                                                        </span>
                                                    )}
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
        </div>
    );
} 