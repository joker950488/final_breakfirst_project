"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function CheckoutPage() {
    const router = useRouter();
    const [cart, setCart] = useState({});
    const [menuItems, setMenuItems] = useState([]);
    const [specialRequests, setSpecialRequests] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user, setUser] = useState({});
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        const sessionUser = sessionStorage.getItem("user");
        if (sessionUser) {
            setUser(JSON.parse(sessionUser));
        } else {
            router.push("/login");
            return;
        }

        const savedCart = sessionStorage.getItem("cart");
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                // 確保解析後的購物車是一個非空物件
                if (typeof parsedCart === 'object' && parsedCart !== null && !Array.isArray(parsedCart) && Object.keys(parsedCart).length > 0) {
                    setCart(parsedCart);
                } else {
                    console.warn("SessionStorage 中的購物車資料格式不正確或為空，正在重設購物車。");
                    sessionStorage.removeItem("cart");
                    setCart({}); // 重設購物車為空物件
                    router.push("/menu"); // 重導到菜單頁面
                    return;
                }
            } catch (e) {
                console.error("從 SessionStorage 解析購物車資料失敗:", e);
                sessionStorage.removeItem("cart");
                setCart({}); // 重設購物車為空物件
                router.push("/menu"); // 重導到菜單頁面
                return;
            }
        } else {
            router.push("/menu");
            return;
        }

        const getMenuItems = async () => {
            try {
                const response = await fetch("/api/menu");
                const data = await response.json();
                setMenuItems(data);
            } catch (err) {
                console.error(err);
                toast.error("獲取菜單失敗");
            }
        };
        getMenuItems();
    }, [router]);

    useEffect(() => {
        const calculateTotalPrice = () => {
            return Object.entries(cart).reduce((total, [itemId, quantity]) => {
                const menuItem = menuItems.find((item) => item.id === itemId);
                
                if (!menuItem) {
                    console.warn(`找不到 ID 為 ${itemId} 的菜單項目，跳過此項計算。`);
                    return total; // 如果找不到菜單項目，則跳過此項並返回當前總計
                }

                const itemPrice = parseFloat(menuItem?.price || 0);
                const itemQuantity = parseInt(quantity || 0, 10);
                
                return total + (itemPrice * itemQuantity);
        }, 0);
    };
        setTotalPrice(calculateTotalPrice());
    }, [cart, menuItems]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const orderItems = Object.entries(cart).map(([itemId, quantity]) => {
                const menuItem = menuItems.find((item) => item.id === itemId);
                const parsedQuantity = parseInt(quantity, 10);

                // 確保 menuItem 存在且 quantity 為有效數字
                if (!menuItem || isNaN(parsedQuantity) || parsedQuantity <= 0) {
                    console.warn(`檢測到無效的購物車項目，itemId: ${itemId}, quantity: ${quantity}。此項目將被忽略。`);
                    return null; // 跳過無效項目
                }

                return {
                    menuItemId: itemId,
                    quantity: parsedQuantity,
                    specialRequest: specialRequests[itemId] || "",
                };
            }).filter(item => item !== null); // 過濾掉所有 null 值 (即無效項目)

            // 如果過濾後沒有有效的訂單項目，則阻止提交
            if (orderItems.length === 0) {
                toast.error("購物車中沒有有效的商品，無法下單！");
                setIsSubmitting(false);
                return;
            }

            // 在這裡加入日誌，查看即將發送的 orderItems
            console.log("即將發送的 orderItems:", orderItems);

            const response = await fetch(`/api/orders/customer/${user.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderItems,
                }),
            });

            if (!response.ok) {
                throw new Error("下單失敗");
            }

            sessionStorage.removeItem("cart");
            toast.success("訂單已送出");
            router.push("/orders");
        } catch (err) {
            console.error("下單失敗：", err);
            toast.error("下單失敗，請稍後再試！");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                確認訂單
            </h1>

            {Object.keys(cart).length === 0 ? (
                <div className="text-center text-gray-500 text-lg mt-20">
                    購物車目前是空的，請先選擇餐點。
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="max-w-2xl mx-auto bg-white shadow-lg rounded-xl p-6 space-y-6"
                >
                    <h2 className="text-xl font-semibold text-gray-700">
                        訂單明細
                    </h2>

                    <ul className="divide-y">
                        {Object.entries(cart).map(([itemId, quantity]) => {
                            const menuItem = menuItems.find(
                                (item) => item.id === itemId
                            );
                            if (!menuItem) return null;

                            return (
                                <li
                                    key={itemId}
                                    className="py-4 space-y-2"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-800 font-medium">
                                            {menuItem.name} × {quantity}
                                        </span>
                                        <span className="text-right font-semibold text-gray-700">
                                            ${(menuItem.price * quantity).toFixed(2)}
                                        </span>
                                    </div>
                                    <div>
                                        <label
                                            htmlFor={`special-request-${itemId}`}
                                            className="block text-sm text-gray-500 mb-1"
                                        >
                                            備註（可選）
                                        </label>
                                        <textarea
                                            id={`special-request-${itemId}`}
                                            className="w-full border rounded-md p-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-300 resize-none"
                                            rows={2}
                                            placeholder="例如：去冰、少糖..."
                                            value={specialRequests[itemId] || ""}
                                            onChange={(e) =>
                                                setSpecialRequests((prev) => ({
                                                    ...prev,
                                                    [itemId]: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="border-t pt-4 text-lg font-bold flex justify-between">
                        <span>總金額：</span>
                        <span>${totalPrice.toFixed(2)}</span>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || Object.keys(cart).length === 0}
                        className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 rounded-md shadow hover:opacity-90 disabled:bg-gray-400 transition duration-300"
                    >
                        {isSubmitting ? "正在送出訂單..." : "送出訂單"}
                    </button>
                </form>
            )}
        </div>
    );
}
