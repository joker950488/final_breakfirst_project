"use client";

import { useEffect, useState } from "react";
// import { io } from "socket.io-client"; // 註解掉 Socket.io 相關 import
import mqtt from "mqtt"; // 引入 MQTT
import toast, { Toaster } from "react-hot-toast"; // 引入 toast 提示
import { useRouter } from "next/navigation";

const MQTT_BROKER_URL = process.env.NEXT_PUBLIC_MQTT_BROKER_URL || "ws://localhost:8083/mqtt";
const MQTT_TOPIC = process.env.NEXT_PUBLIC_MQTT_TOPIC || "orders/status";

export default function CaptainPage() {
    const [orders, setOrders] = useState([]);
    // const [socket, setSocket] = useState(null); // 註解掉 Socket.io 相關 state
    const [user, setUser] = useState(null);
    const [mqttClient, setMqttClient] = useState(null); // 新增 MQTT client state
    const [isConnected, setIsConnected] = useState(false); // 新增 MQTT 連線狀態 state
    const router = useRouter();

    // 新增獲取訂單的函數
    const getOrders = async () => {
        try {
            const user = JSON.parse(sessionStorage.getItem("user"));
            if (!user) {
                router.push("/login");
                return;
            }

            const response = await fetch(`/api/orders/captain?captainId=${user.id}`);
            if (!response.ok) {
                if (response.status === 401) {
                    router.push("/login");
                    return;
                }
                throw new Error("獲取訂單失敗");
            }

            const data = await response.json();
            setOrders(data);
        } catch (error) {
            console.error("獲取訂單失敗:", error);
            toast.error("獲取訂單失敗，請稍後再試");
        }
    };

    useEffect(() => {
        // 從 sessionStorage 獲取用戶信息
        const sessionUser = sessionStorage.getItem("user");
        if (sessionUser) {
            const userData = JSON.parse(sessionUser);
            setUser(userData);
        }
    }, []); // 只在組件掛載時執行一次

    // 新增一個 useEffect 來處理訂單獲取
    useEffect(() => {
        if (user?.id) {
            getOrders();
        }
    }, [user]); // 當 user 更新時執行

    // 新增一個 useEffect 來處理 MQTT 連接
    useEffect(() => {
        if (!user?.id) return;

        // 初始化 MQTT 連接
        const client = mqtt.connect(MQTT_BROKER_URL);

        client.on("connect", () => {
            console.log("MQTT 已連接 (外送員頁面)");
            setIsConnected(true);
            client.subscribe(MQTT_TOPIC);
            console.log("已訂閱主題:", MQTT_TOPIC);
        });

        client.on("message", (topic, message) => {
            try {
                const orderUpdate = JSON.parse(message.toString());
                console.log("收到 MQTT 訊息 (外送員頁面):", orderUpdate);
                console.log("當前用戶ID:", user.id, "訂單指派的隊長ID:", orderUpdate.order?.captainId);
                
                // 處理指派訂單通知
                if (orderUpdate.type === "assign-captain" && orderUpdate.order?.captainId === user.id) {
                    setOrders(prev => {
                        const isExisting = prev.find(order => order.id === orderUpdate.order.id);
                        console.log("訂單是否存在於當前狀態:", isExisting, "訂單ID:", orderUpdate.order.id);
                        if (!isExisting) {
                            console.log("將新訂單加入狀態中:", orderUpdate.order);
                            return [orderUpdate.order, ...prev];
                        }
                        console.log("訂單已存在或不屬於此隊長，不加入狀態。");
                        return prev;
                    });

                    // 顯示 toast 通知
                    toast.custom((t) => (
                        <div
                            className={`max-w-xs w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 p-4 border-l-4 border-blue-500 ${t.visible ? 'animate-enter' : 'animate-leave'}`}
                            onClick={() => setExpandedOrderId(orderUpdate.order.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="flex items-start">
                                <div className="flex-1 w-0">
                                    <p className="text-sm font-bold text-blue-700 mb-1">
                                        新訂單指派通知
                                    </p>
                                    <p className="text-xs text-gray-500 mb-1">
                                        訂單編號：{orderUpdate.order.id.slice(0, 8)}
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

                // 處理訂單完成/送達通知
                if (orderUpdate.type === "update" && (orderUpdate.status === "COMPLETED" || orderUpdate.status === "DELIVERED")) {
                    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderUpdate.orderId));
                }
            } catch (error) {
                console.error("解析 MQTT 訊息失敗:", error);
            }
        });

        client.on("error", (error) => {
            console.error("MQTT 錯誤:", error);
            setIsConnected(false);
        });

        client.on("close", () => {
            console.log("MQTT 連接已關閉 (外送員頁面)");
            setIsConnected(false);
        });

        client.on("reconnect", () => {
            console.log("MQTT 正在重新連接 (外送員頁面)...");
        });

        client.on("offline", () => {
            console.log("MQTT 已離線 (外送員頁面)");
            setIsConnected(false);
        });

        setMqttClient(client);

        return () => {
            if (client) {
                client.end();
            }
        };
    }, [user?.id]); // 添加 user?.id 作為依賴項

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

    // Socket.io 相關邏輯不再需要，已註解
    // useEffect(() => {
    //     // 從 sessionStorage 獲取用戶信息
    //     const sessionUser = sessionStorage.getItem("user");
    //     if (sessionUser) {
    //         const userData = JSON.parse(sessionUser);
    //         setUser(userData);
            
    //         // 初始化 Socket.io 連接
    //         const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL);
    //         setSocket(socketInstance);

    //         // 加入角色房間
    //         socketInstance.emit('join-role', 'CAPTAIN');

    //         // 監聽新訂單
    //         socketInstance.on('order-assigned', (data) => {
    //             setOrders(prev => [...prev, data.order]);
    //         });

    //         // 監聽訂單狀態變化
    //         socketInstance.on('order-status-changed', (data) => {
    //             setOrders(prev => 
    //                 prev.map(order => 
    //                     order.id === data.orderId 
    //                         ? { ...order, status: data.status }
    //                         : order
    //                 )
    //             );
    //         });

    //         return () => {
    //             socketInstance.disconnect();
    //         };
    //     }
    // }, []);

    const handleCompleteDelivery = async (orderId) => {
        try {
            const response = await fetch('/api/orders/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    status: 'DELIVERED'
                }),
            });

            if (!response.ok) {
                throw new Error('更新訂單狀態失敗');
            }

            // 從列表中移除已完成的訂單
            setOrders(prev => prev.filter(order => order.id !== orderId));
            toast.success('訂單已完成派送');
        } catch (error) {
            console.error('完成派送失敗:', error);
            toast.error('完成派送失敗，請稍後再試');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 px-4 sm:px-6 py-8">
            <Toaster position="top-right" /> {/* 新增 Toaster 元件 */}
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        🚚 外送訂單
                    </h1>
                    <button
                        onClick={() => router.push("/captain/history")}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                    >
                        查看歷史訂單
                    </button>
                </div>
                {!isConnected && (
                     <p className="text-red-600 text-center sm:text-left mb-4">⚠️ MQTT 即時通知未連接</p>
                )}

                {orders.length === 0 ? (
                    <p className="text-gray-500 text-center sm:text-left">
                        目前沒有待派送的訂單。
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
                                    <span className="mt-2 sm:mt-0 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {getStatusText(order.status) || order.status}
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
                                    <p className="text-red-600">
                                        <strong>付款方式：</strong> 貨到付款
                                    </p>
                                    {order.captain && (
                                        <p className="text-gray-700">
                                            <strong>指派外送員：</strong> {order.captain.name}
                                        </p>
                                    )}
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-semibold text-gray-700 mb-2">
                                        訂單內容：
                                    </h4>
                                    <ul className="space-y-2">
                                        {order.items.map((item) => (
                                            <li
                                                key={item.id}
                                                className="flex justify-between text-sm text-gray-600"
                                            >
                                                <span>
                                                    {item.menuItem.name} × {item.quantity}
                                                </span>
                                                <span>
                                                    ${(item.menuItem.price * item.quantity).toFixed(2)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {order.captain?.id === user?.id && (
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={() => handleCompleteDelivery(order.id)}
                                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                                        >
                                            ✅ 確認送達
                                        </button>
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