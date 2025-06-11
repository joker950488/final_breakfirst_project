"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";

export default function MenuPage() {
    const router = useRouter();
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState({});
    const [activeCategory, setActiveCategory] = useState("全部");

    // const menus = [
    //     {
    //         id: "item-1",
    //         name: "經典蛋餅",
    //         description: "香煎蛋餅搭配醬油膏與胡椒，酥脆外皮包覆滑嫩蛋香。",
    //         price: 35,
    //         imageUrl: "/food01.jpg",
    //         isAvailable: true,
    //     },
    //     {
    //         id: "item-2",
    //         name: "火腿起司三明治",
    //         description: "火腿與起司完美結合，吐司外酥內軟，一口幸福。",
    //         price: 45,
    //         imageUrl: "/food02.jpg",
    //         isAvailable: true,
    //     },
    //     {
    //         id: "item-3",
    //         name: "鐵板炒麵",
    //         description: "熱騰騰的鐵板炒麵配上醬香與蔬菜，份量十足的元氣早餐。",
    //         price: 55,
    //         imageUrl: "/food03.jpg",
    //         isAvailable: true,
    //     },
    //     {
    //         id: "item-4",
    //         name: "蘿蔔糕套餐",
    //         description: "煎得金黃酥脆的蘿蔔糕，附上特製辣椒醬與荷包蛋。",
    //         price: 40,
    //         imageUrl: "/food04.jpg",
    //         isAvailable: true,
    //     },
    //     {
    //         id: "item-5",
    //         name: "奶茶（中杯）",
    //         description: "香濃紅茶加上新鮮牛奶，早晨的最佳拍檔。",
    //         price: 25,
    //         imageUrl: "/images/milk-tea.jpg",
    //         isAvailable: false,
    //     },
    // ];

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedCart = sessionStorage.getItem('cart');
            if (savedCart) {
                try {
                    const parsedCart = JSON.parse(savedCart);
                    if (typeof parsedCart === 'object' && parsedCart !== null && !Array.isArray(parsedCart)) {
                        setCart(parsedCart);
                    } else {
                        console.warn("SessionStorage 中的購物車資料格式不正確，正在重設購物車。");
                        sessionStorage.removeItem('cart');
                        setCart({});
                    }
                } catch (e) {
                    console.error("從 SessionStorage 解析購物車資料失敗:", e);
                    sessionStorage.removeItem('cart');
                    setCart({});
                }
            }
        }
        getMenuItems();
    }, []);

    const getMenuItems = async () => {
        try {
            const response = await fetch("/api/menu");
            if (!response.ok) throw new Error("獲取菜單失敗");
            const data = await response.json();
            setMenuItems(data);
        } catch (error) {
            console.error("獲取菜單失敗:", error);
            toast.error("獲取菜單失敗，請稍後再試");
        }
    };

    const addToCart = (itemId) => {
        setCart((prev) => {
            const newCart = {
                ...prev,
                [itemId]: (prev[itemId] || 0) + 1,
            };
            sessionStorage.setItem('cart', JSON.stringify(newCart));
            return newCart;
        });
        toast.success("已加入購物車");
    };

    const removeFromCart = (itemId) => {
        setCart((prev) => {
            const newCart = { ...prev };
            if (newCart[itemId] > 1) {
                newCart[itemId]--;
            } else {
                delete newCart[itemId];
            }
            sessionStorage.setItem('cart', JSON.stringify(newCart));
            return newCart;
        });
    };

    const getCartItemCount = (itemId) => {
        return cart[itemId] || 0;
    };

    const getTotalItems = () => {
        return Object.values(cart).reduce((total, quantity) => {
            return total + (parseInt(quantity, 10) || 0);
        }, 0);
    };

    const getTotalPrice = () => {
        return menuItems.reduce((total, item) => {
            const price = parseFloat(item.price || 0);
            const quantity = parseInt(cart[item.id] || 0, 10);
            return total + (price * quantity);
        }, 0);
    };

    const handleCheckout = () => {
        if (getTotalItems() === 0) {
            toast.error("購物車是空的");
            return;
        }
        const cartItems = Object.entries(cart).map(([itemId, quantity]) => ({
            menuItemId: itemId,
            quantity,
        }));
        router.push("/checkout");
    };

    // 獲取所有分類
    const categories = ["全部", ...new Set(menuItems.map(item => item.category))];

    // 根據選擇的分類過濾菜單項目
    const filteredMenuItems = activeCategory === "全部" 
        ? menuItems 
        : menuItems.filter(item => item.category === activeCategory);

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 px-4 sm:px-6 py-8">
            <Toaster position="top-right" />
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">菜單</h1>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button
                                onClick={handleCheckout}
                                className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-md hover:opacity-90 transition"
                            >
                                購物車 ({getTotalItems()})
                            </button>
                            {getTotalItems() > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {getTotalItems()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 分類選擇器 */}
                <div className="mb-6 overflow-x-auto">
                    <div className="flex space-x-2 pb-2">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                    activeCategory === category
                                        ? "bg-gradient-to-r from-pink-500 to-red-500 text-white"
                                        : "bg-white text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredMenuItems.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                        >
                            <div className="relative h-48">
                                <img
                                    src={item.imageUrl || "/food01.jpg"}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                                {!item.isAvailable && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <span className="text-white font-bold">已售完</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                    {item.name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                    {item.description}
                                </p>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-900">
                                        ${item.price}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {getCartItemCount(item.id) > 0 && (
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition"
                                            >
                                                -
                                            </button>
                                        )}
                                        {getCartItemCount(item.id) > 0 && (
                                            <span className="text-gray-700">
                                                {getCartItemCount(item.id)}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => addToCart(item.id)}
                                            disabled={!item.isAvailable}
                                            className={`w-8 h-8 flex items-center justify-center rounded-full transition ${
                                                item.isAvailable
                                                    ? "bg-gradient-to-r from-pink-500 to-red-500 text-white hover:opacity-90"
                                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                            }`}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
