"use client"

import { useEffect, useState } from "react";
import mqtt from "mqtt";

const MQTT_BROKER_URL = process.env.NEXT_PUBLIC_MQTT_BROKER_URL || "wss://broker.emqx.io:8084/mqtt";
const MQTT_TOPIC = process.env.NEXT_PUBLIC_MQTT_TOPIC || "nuu/esic/breakfirst";

export default function MqttPage() {
    const [client, setClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        // 連接到 MQTT broker
        const mqttClient = mqtt.connect(MQTT_BROKER_URL);

        mqttClient.on("connect", () => {
            console.log("已連接到 MQTT broker");
            setIsConnected(true);
            mqttClient.subscribe(MQTT_TOPIC);
        });

        mqttClient.on("message", (topic, message) => {
            try {
                const newMessage = {
                    topic,
                    message: JSON.parse(message.toString()),
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [newMessage, ...prev].slice(0, 50)); // 只保留最新的 50 條消息
            } catch (error) {
                console.error("解析 MQTT 訊息失敗:", error);
            }
        });

        mqttClient.on("error", (error) => {
            console.error("MQTT 錯誤:", error);
            setIsConnected(false);
        });

        setClient(mqttClient);

        return () => {
            if (mqttClient) {
                mqttClient.end();
            }
        };
    }, []);

    const publishMessage = (message) => {
        if (client && isConnected) {
            client.publish(MQTT_TOPIC, JSON.stringify(message));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">MQTT 測試頁面</h1>
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="mb-4">
                        <p className="text-lg">
                            連接狀態:{" "}
                            <span className={isConnected ? "text-green-600" : "text-red-600"}>
                                {isConnected ? "已連接" : "未連接"}
                            </span>
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">收到的訊息：</h2>
                        <div className="max-h-96 overflow-y-auto">
                            {messages.map((msg, index) => (
                                <div key={index} className="bg-gray-50 p-3 rounded mb-2">
                                    <p className="text-sm text-gray-500">
                                        {new Date(msg.timestamp).toLocaleString()}
                                    </p>
                                    <p className="font-medium">主題: {msg.topic}</p>
                                    <pre className="mt-2 text-sm bg-gray-100 p-2 rounded overflow-x-auto">
                                        {JSON.stringify(msg.message, null, 2)}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}