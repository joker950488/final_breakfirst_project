import mqtt from "mqtt";

const MQTT_BROKER_URL = process.env.NEXT_PUBLIC_MQTT_BROKER_URL || "wss://broker.emqx.io:8084/mqtt";
const MQTT_TOPIC = process.env.NEXT_PUBLIC_MQTT_TOPIC || "nuu/esic/breakfirst";

const options = {
    clientId: `mqttjs_${Math.random().toString(16).substr(2, 8)}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
    rejectUnauthorized: false
};

const client = mqtt.connect(MQTT_BROKER_URL, options);

client.on("connect", () => {
    console.log("MQTT 已連接");
    // 訂閱主題
    client.subscribe(MQTT_TOPIC, (err) => {
        if (err) {
            console.error("訂閱主題失敗:", err);
        } else {
            console.log(`已訂閱主題: ${MQTT_TOPIC}`);
        }
    });
});

client.on("error", (error) => {
    console.error("MQTT 錯誤:", error);
});

client.on("close", () => {
    console.log("MQTT 連接已關閉");
});

client.on("reconnect", () => {
    console.log("MQTT 正在重新連接...");
});

client.on("offline", () => {
    console.log("MQTT 已離線");
});

export function notifyOrderStatus(order, eventType = "update") {
    if (!client.connected) {
        console.error("MQTT 未連接，無法發送消息");
        return;
    }

    const msg = JSON.stringify({
        type: eventType,
        orderId: order.id,
        status: order.status,
        user: order.customer?.name || order.user || null,
        time: new Date().toISOString(),
        order
    });

    client.publish(MQTT_TOPIC, msg, { qos: 1 }, (err) => {
        if (err) {
            console.error("發送 MQTT 消息失敗:", err);
        } else {
            console.log("MQTT 消息已發送");
        }
    });
} 