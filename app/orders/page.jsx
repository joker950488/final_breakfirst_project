"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import mqtt from "mqtt";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

const MQTT_BROKER_URL = process.env.NEXT_PUBLIC_MQTT_BROKER_URL || "ws://localhost:8083/mqtt";
const MQTT_TOPIC = process.env.NEXT_PUBLIC_MQTT_TOPIC || "orders/status";

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [mqttClient, setMqttClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [deliveryType, setDeliveryType] = useState(null);
    const [captains, setCaptains] = useState([]);
    const [selectedCaptain, setSelectedCaptain] = useState(null);
    const [street, setStreet] = useState("");
    const [alley, setAlley] = useState("");
    const [number, setNumber] = useState("");
    const [floor, setFloor] = useState("");
    const [room, setRoom] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [addressError, setAddressError] = useState("");
    const [city, setCity] = useState("");
    const [modalStep, setModalStep] = useState(1);

    const restaurantAddress = "苗栗縣苗栗市聯大2號"; // 請替換為實際的餐廳地址

    // 縣市選項
    const cities = [
        { value: "苗栗縣苗栗市", label: "苗栗縣苗栗市" },
        // 可以加入更多縣市
    ];

    useEffect(() => {
        // 連接到 MQTT broker
        const client = mqtt.connect(MQTT_BROKER_URL);

        client.on("connect", () => {
            console.log("已連接到 MQTT broker");
            setIsConnected(true);
            client.subscribe(MQTT_TOPIC);
        });

        client.on("message", (topic, message) => {
            try {
                const orderUpdate = JSON.parse(message.toString());
                if (orderUpdate.type === "update" || orderUpdate.type === "create") {
                    setOrders(prevOrders => {
                        const existingOrder = prevOrders.find(order => order.id === orderUpdate.orderId);
                        if (existingOrder) {
                            return prevOrders.map(order => 
                                order.id === orderUpdate.orderId 
                                    ? { ...order, ...orderUpdate.order }
                                    : order
                            );
                        } else if (orderUpdate.type === "create") {
                            return [orderUpdate.order, ...prevOrders];
                        }
                        return prevOrders;
                    });
                    // 顯示 toast 通知
                    toast.custom((t) => (
                        <div
                            className={`max-w-xs w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 p-4 border-l-4 ${orderUpdate.status === 'READY' ? 'border-green-500' : 'border-pink-500'} ${t.visible ? 'animate-enter' : 'animate-leave'}`}
                            onClick={() => setExpandedOrderId(orderUpdate.orderId)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="flex items-start">
                                <div className="flex-1 w-0">
                                    <p className="text-sm font-bold text-pink-700 mb-1">
                                        訂單狀態更新：{getStatusText(orderUpdate.status)}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-1">
                                        訂單編號：{orderUpdate.orderId.slice(0, 8)}
                                    </p>
                                    <div className="text-xs text-gray-700">
                                        {orderUpdate.order?.items?.map(item => (
                                            <div key={item.id}>
                                                {item.menuItem.name} × {item.quantity}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-blue-600 mt-2 underline">點擊查看詳細內容</p>
                                </div>
                            </div>
                        </div>
                    ), { duration: 4000 });
                }
            } catch (error) {
                console.error("解析 MQTT 訊息失敗:", error);
            }
        });

        client.on("error", (error) => {
            console.error("MQTT 錯誤:", error);
            setIsConnected(false);
        });

        setMqttClient(client);

        return () => {
            if (client) {
                client.end();
            }
        };
    }, []);

    const getOrders = async () => {
        try {
            const user = JSON.parse(sessionStorage.getItem("user"));
            if (!user) {
                router.push("/login");
                return;
            }

            let response;
            if (user.role === "OWNER") {
                response = await fetch("/api/orders/completed", {
                    headers: {
                        "x-user-id": user.id
                    }
                });
            } else {
                response = await fetch(`/api/orders/${user.id}`);
            }

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
        getOrders();
    }, [router]);

    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING":
                return "bg-yellow-100 text-yellow-800";
            case "PREPARING":
                return "bg-blue-100 text-blue-800";
            case "READY":
                return "bg-green-100 text-green-800";
            case "COMPLETED":
                return "bg-gray-100 text-gray-800";
            case "CANCELLED":
                return "bg-red-100 text-red-800";
            case "DELIVERING":
                return "bg-purple-100 text-purple-800";
            case "DELIVERED":
                return "bg-indigo-100 text-indigo-800";
            default:
                return "bg-gray-100 text-gray-800";
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

    const showDeliveryOptionsModal = (orderId) => {
        setSelectedOrderId(orderId);
        setShowDeliveryOptions(true);
        setDeliveryType(null);
        setSelectedCaptain(null);
        setModalStep(1);
        setAddressError("");
        setStreet("");
        setAlley("");
        setNumber("");
        setFloor("");
        setRoom("");
        setPhoneNumber("");
        setCity("");
        console.log("showDeliveryOptionsModal - Initializing modal, modalStep set to 1");
    };

    const handleDeliveryTypeSelect = async (type) => {
        console.log("handleDeliveryTypeSelect - type:", type);
        setDeliveryType(type);
        if (type === "delivery") {
            // 當選擇外送時，直接進入步驟2，並獲取外送員列表 (用於步驟3)
            try {
                const response = await fetch("/api/users/captains");
                if (!response.ok) throw new Error("獲取外送人員失敗");
                const data = await response.json();
                setCaptains(data);
                setModalStep(2); // 跳到步驟2，顯示地址輸入
            } catch (error) {
                console.error("獲取外送人員失敗:", error);
                toast.error("獲取外送人員失敗，請稍後再試");
            }
        } else if (type === "pickup") {
            setModalStep(2); // 自取也跳到步驟2，顯示自取資訊
        }
    };

    const handleGoToCaptainSelection = () => {
        console.log("handleGoToCaptainSelection - current values:", { city, street, phoneNumber });
        // 驗證地址資訊
        if (!city) {
            setAddressError("請選擇縣市");
            return;
        }

        if (city !== "苗栗縣苗栗市") {
            setAddressError("距離太遠，暫不提供外送服務");
            return;
        }

        if (!street.trim()) {
            setAddressError("請輸入詳細地址（街路名稱）");
            return;
        }

        if (!phoneNumber.trim()) {
            setAddressError("請輸入電話號碼");
            return;
        }

        setAddressError(""); // 清除之前的錯誤訊息
        setModalStep(3); // 進入步驟3，顯示外送員列表
    };

    const handleCaptainSelect = async (captainId) => {
        setSelectedCaptain(captainId);
        try {
            const response = await fetch("/api/orders/assign-captain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: selectedOrderId,
                    captainId: captainId,
                    // 組合完整的送餐地址字串，加入縣市資訊
                    deliveryAddress: `${city}${street}${alley ? alley + '巷' : ''}${number ? number + '號' : ''}${floor ? floor + '樓' : ''}${room ? room + '室' : ''}`.trim(),
                    deliveryPhone: phoneNumber.trim(),
                })
            });

            if (!response.ok) throw new Error("指派外送人員失敗");
            
            await fetch("/api/orders/update-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: selectedOrderId,
                    status: "DELIVERING"
                })
            });

            toast.success("已成功指派外送人員");
            setShowDeliveryOptions(false);
            getOrders();
        } catch (error) {
            console.error("指派外送人員失敗:", error);
            toast.error("指派外送人員失敗，請稍後再試");
        }
    };

    const handleConfirmPickup = async () => {
        console.log("確認自取訂單 ID:", selectedOrderId);
        try {
            const response = await fetch("/api/orders/update-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: selectedOrderId,
                    status: "COMPLETED"
                })
            });

            if (!response.ok) throw new Error("更新訂單狀態失敗");
            
            toast.success("已確認自取");
            setShowDeliveryOptions(false);
            getOrders();
        } catch (error) {
            console.error("更新訂單狀態失敗:", error);
            toast.error("更新訂單狀態失敗，請稍後再試");
        }
    };

    const handleCompleteOrder = async (orderId) => {
        try {
            const response = await fetch("/api/orders/update-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: orderId,
                    status: "DELIVERED"
                }),
            });

            if (!response.ok) throw new Error("更新訂單狀態失敗");

            toast.success("訂單已完成");
            getOrders();
        } catch (error) {
            console.error("更新訂單狀態失敗:", error);
            toast.error("更新訂單狀態失敗，請稍後再試");
        }
    };

    const getSelectedOrder = () => {
        return orders.find(order => order.id === selectedOrderId);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 px-4 py-8">
            <Toaster position="top-right" />
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        我的訂單
                    </h1>
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.push("/orders/history")}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                        >
                            查看歷史訂單
                        </button>
                        {!isConnected && (
                            <span className="text-red-600 text-sm">
                                ⚠️ 即時通知未連接
                            </span>
                        )}
                    </div>
                </div>

                {showDeliveryOptions && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            {modalStep === 1 && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-semibold mb-4">選擇取餐方式</h2>
                                    <button
                                        onClick={() => handleDeliveryTypeSelect("delivery")}
                                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        外送
                                    </button>
                                    <button
                                        onClick={() => handleDeliveryTypeSelect("pickup")}
                                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        自取
                                    </button>
                                </div>
                            )}

                            {modalStep === 2 && deliveryType === "delivery" && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-semibold mb-4">外送資訊</h2>
                                    <div className="space-y-2 mb-4">
                                        {/* 縣市選擇 */}
                                        <div>
                                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">縣市 <span className="text-red-500">*</span></label>
                                            <select
                                                id="city"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            >
                                                <option value="">請選擇縣市</option>
                                                {cities.map((city) => (
                                                    <option key={city.value} value={city.value}>
                                                        {city.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">街路名稱 <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                id="street"
                                                value={street}
                                                onChange={(e) => setStreet(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="請輸入街路名稱 (例: 信義路)"
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="w-1/2">
                                                <label htmlFor="alley" className="block text-sm font-medium text-gray-700 mb-1">巷弄 (選填)</label>
                                                <input
                                                    type="text"
                                                    id="alley"
                                                    value={alley}
                                                    onChange={(e) => setAlley(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="例: 123"
                                                />
                                            </div>
                                            <div className="w-1/2">
                                                <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">號 (選填)</label>
                                                <input
                                                    type="text"
                                                    id="number"
                                                    value={number}
                                                    onChange={(e) => setNumber(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="例: 456"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="w-1/2">
                                                <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-1">樓層 (選填)</label>
                                                <input
                                                    type="text"
                                                    id="floor"
                                                    value={floor}
                                                    onChange={(e) => setFloor(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="例: 7"
                                                />
                                            </div>
                                            <div className="w-1/2">
                                                <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-1">室號 (選填)</label>
                                                <input
                                                    type="text"
                                                    id="room"
                                                    value={room}
                                                    onChange={(e) => setRoom(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="例: 89"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {addressError && (
                                        <p className="mt-1 text-sm text-red-600">{addressError}</p>
                                    )}
                                    <div className="mb-4">
                                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">電話號碼 <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            id="phoneNumber"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="請輸入電話號碼"
                                            required
                                        />
                                    </div>
                                    <button
                                        onClick={handleGoToCaptainSelection}
                                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition flex items-center justify-center gap-2"
                                    >
                                        下一步 (選擇外送員)
                                    </button>
                                    <button
                                        onClick={() => setModalStep(1)} // 返回上一步
                                        className="mt-4 w-full text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2"
                                    >
                                        返回
                                    </button>
                                </div>
                            )}

                            {modalStep === 3 && deliveryType === "delivery" && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-semibold mb-4">選擇外送人員</h2>
                                    {captains.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">目前沒有可用的外送人員</p>
                                    ) : (
                                        captains.map((captain) => (
                                            <button
                                                key={captain.id}
                                                onClick={() => handleCaptainSelect(captain.id)}
                                                className={`w-full p-4 rounded-lg border transition-all ${selectedCaptain === captain.id ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 hover:border-blue-300 hover:shadow-sm"}`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        {captain.avatarUrl ? (
                                                            <img
                                                                src={captain.avatarUrl}
                                                                alt={captain.name}
                                                                className="w-10 h-10 object-cover rounded-full"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                                <span className="text-xl text-gray-500">
                                                                    {captain.name.charAt(0)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-medium text-gray-800">{captain.name}</p>
                                                            <p className="text-sm text-gray-500">{captain.phone}</p>
                                                        </div>
                                                    </div>
                                                    {selectedCaptain === captain.id && (
                                                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                    <button
                                        onClick={() => setModalStep(2)} // 返回外送資訊頁面
                                        className="mt-4 w-full text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2"
                                    >
                                        返回
                                    </button>
                                </div>
                            )}

                            {modalStep === 2 && deliveryType === "pickup" && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-semibold mb-4">自取資訊</h2>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="mb-4">
                                            <p className="font-medium text-gray-700 mb-1">餐廳地址：</p>
                                            <p className="text-gray-600">{restaurantAddress}</p>
                                        </div>
                                        
                                        <div className="mb-4">
                                            <p className="font-medium text-gray-700 mb-1">訂單編號：</p>
                                            <p className="text-gray-600">#{selectedOrderId?.slice(0, 8)}</p>
                                        </div>
                                        
                                        <div className="mb-4">
                                            <p className="font-medium text-gray-700 mb-1">訂單時間：</p>
                                            <p className="text-gray-600">{getSelectedOrder()?.createdAt ? new Date(getSelectedOrder()?.createdAt).toLocaleString() : '載入中...'}</p>
                                        </div>
                                        
                                        <div className="mb-4">
                                            <p className="font-medium text-gray-700 mb-1">訂單內容：</p>
                                            <div className="space-y-2">
                                                {getSelectedOrder()?.items.map((item) => (
                                                    <div key={item.id} className="flex justify-between text-gray-600">
                                                        <span>{item.menuItem.name} × {item.quantity}</span>
                                                        <span>${item.menuItem.price * item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="border-t pt-3">
                                            <div className="flex justify-between items-center">
                                                <p className="font-medium text-gray-700">總金額：</p>
                                                <p className="text-lg font-semibold text-gray-800">${getSelectedOrder()?.totalAmount}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleConfirmPickup}
                                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        確認自取
                                    </button>
                                    <button
                                        onClick={() => setModalStep(1)}
                                        className="mt-4 w-full text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2"
                                    >
                                        返回
                                    </button>
                                </div>
                            )}

                            {/* 取消按鈕始終可見 */}
                            <button
                                onClick={() => {
                                    console.log("Cancelling modal, resetting states");
                                    setShowDeliveryOptions(false);
                                    setDeliveryType(null);
                                    setSelectedCaptain(null);
                                    setModalStep(1);
                                }}
                                className="mt-4 w-full text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                取消
                            </button>
                        </div>
                    </div>
                )}

                {orders.length === 0 ? (
                    <p className="text-gray-500 text-center sm:text-left">
                        您目前沒有任何訂單。
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
                                            {new Date(
                                                order.createdAt
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                    <span
                                        className={`mt-2 sm:mt-0 px-3 py-2 rounded-full text-xs font-medium ${getStatusColor(
                                            order.status
                                        )}`}
                                    >
                                        {getStatusText(order.status)}
                                    </span>
                                </div>

                                <div className="mb-3 space-y-1">
                                    <p className="text-gray-700">
                                        <strong>總金額：</strong> $
                                        {order.totalAmount.toFixed(2)}
                                    </p>
                                    <p
                                        className={
                                            order.paymentStatus
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }
                                    >
                                        <strong>付款狀態：</strong>{" "}
                                        {order.paymentStatus
                                            ? "已付款"
                                            : "未付款"}
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
                                                    {item.menuItem.name} ×{" "}
                                                    {item.quantity}
                                                    {item.specialRequest && (
                                                        <span className="block text-xs text-gray-400">
                                                            備註：
                                                            {
                                                                item.specialRequest
                                                            }
                                                        </span>
                                                    )}
                                                </span>
                                                <span>
                                                    $
                                                    {(
                                                        item.menuItem.price *
                                                        item.quantity
                                                    ).toFixed(2)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {order.status === "READY" &&
                                    !order.completedAt && (
                                        <div className="mt-4 text-center sm:text-right">
                                            <button
                                                onClick={() => showDeliveryOptionsModal(order.id)}
                                                className="inline-block bg-gradient-to-r from-green-500 to-green-700 text-white px-5 py-2 rounded-md hover:opacity-90 transition"
                                            >
                                                確認取餐
                                            </button>
                                        </div>
                                    )}
                                {order.status === "DELIVERING" && (
                                    <div className="mt-4 text-center sm:text-right">
                                        <button
                                            onClick={() => handleCompleteOrder(order.id)}
                                            className="inline-block bg-gradient-to-r from-blue-500 to-blue-700 text-white px-5 py-2 rounded-md hover:opacity-90 transition"
                                        >
                                            完成訂單
                                        </button>
                                    </div>
                                )}
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
                                                            {item.menuItem.name} × {item.quantity}
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
