import { NextResponse } from "next/server";
import mqtt from "mqtt";

let client = null;

// 初始化 MQTT 客戶端
function initMqttClient() {
    if (!client) {
        client = mqtt.connect(process.env.MQTT_BROKER_URL || "wss://broker.emqx.io:8084/mqtt");

        client.on("connect", () => {
            console.log("MQTT 已連接");
        });

        client.on("error", (error) => {
            console.error("MQTT 錯誤:", error);
        });

        client.on("close", () => {
            console.log("MQTT 連接已關閉");
        });
    }
    return client;
}

export async function POST(request) {
    try {
        const { orderId, status, order } = await request.json();

        if (!orderId || !status) {
            return NextResponse.json(
                { message: "缺少必要參數" },
                { status: 400 }
            );
        }

        const mqttClient = initMqttClient();

        if (!mqttClient.connected) {
            return NextResponse.json(
                { message: "MQTT 未連接" },
                { status: 500 }
            );
        }

        // 發布訂單更新消息
        const message = JSON.stringify({
            type: "update",
            orderId,
            status,
            order
        });

        mqttClient.publish(
            process.env.MQTT_TOPIC || "breakfast-orders",
            message,
            { qos: 1 },
            (error) => {
                if (error) {
                    console.error("發布消息失敗:", error);
                } else {
                    console.log("消息已發布:", message);
                }
            }
        );

        return NextResponse.json({ message: "消息已發布" });
    } catch (error) {
        console.error("處理 MQTT 請求失敗:", error);
        return NextResponse.json(
            { message: "伺服器錯誤", error: String(error) },
            { status: 500 }
        );
    }
} 