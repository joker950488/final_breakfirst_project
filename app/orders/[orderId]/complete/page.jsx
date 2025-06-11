import OrderCompleteClient from "./OrderCompleteClient";

export default function OrderCompletePage({ params }) {
    return <OrderCompleteClient orderId={params.orderId} />;
} 