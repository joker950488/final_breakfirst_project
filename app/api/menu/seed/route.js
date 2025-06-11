import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
    try {
        // 先清空現有菜單
        await prisma.menuItem.deleteMany({});

        // 創建菜單項目
        const menuItems = [
            // 漢堡類
            {
                name: "經典牛肉堡",
                description: "多汁牛肉排搭配新鮮生菜和特製醬料，美味可口。",
                price: 65,
                imageUrl: "/food01.jpg",
                isAvailable: true,
                category: "漢堡類"
            },
            {
                name: "雞肉堡",
                description: "香煎雞肉搭配生菜和特製醬料，健康美味。",
                price: 55,
                imageUrl: "/food02.jpg",
                isAvailable: true,
                category: "漢堡類"
            },
            {
                name: "雙層起司牛肉堡",
                description: "兩層牛肉排加上濃郁起司，飽足感十足。",
                price: 85,
                imageUrl: "/food03.jpg",
                isAvailable: true,
                category: "漢堡類"
            },
            {
                name: "辣味雞腿堡",
                description: "酥脆雞腿排配上特製辣醬，嗜辣者首選。",
                price: 70,
                imageUrl: "/food04.jpg",
                isAvailable: true,
                category: "漢堡類"
            },
            {
                name: "培根牛肉堡",
                description: "鹹香培根與多汁牛肉完美融合，風味絕佳。",
                price: 75,
                imageUrl: "/food05.jpg",
                isAvailable: true,
                category: "漢堡類"
            },
            {
                name: "魚排堡",
                description: "香酥魚排搭配塔塔醬與生菜，清爽不油膩。",
                price: 60,
                imageUrl: "/food06.jpg",
                isAvailable: true,
                category: "漢堡類"
            },
            {
                name: "蔬菜漢堡",
                description: "素食者專屬，滿滿蔬菜與特調醬料，營養滿分。",
                price: 50,
                imageUrl: "/food07.jpg",
                isAvailable: true,
                category: "漢堡類"
            },
            {
                name: "墨西哥辣味牛肉堡",
                description: "加入墨西哥辣椒與莎莎醬，熱情洋溢的風味體驗。",
                price: 80,
                imageUrl: "/food08.jpg",
                isAvailable: true,
                category: "漢堡類"
            },
            // 現烤土司
            {
                name: "火腿起司土司",
                description: "火腿與起司完美結合，吐司外酥內軟，一口幸福。",
                price: 45,
                imageUrl: "/food09.jpg",
                isAvailable: true,
                category: "現烤土司"
            },
            {
                name: "培根蛋土司",
                description: "香煎培根搭配滑嫩蛋，夾在酥脆吐司中，營養滿分。",
                price: 45,
                imageUrl: "/food10.jpg",
                isAvailable: true,
                category: "現烤土司"
            },
            {
                name: "花生醬土司",
                description: "濃郁花生醬塗滿整片吐司，甜而不膩，經典早餐首選。",
                price: 35,
                imageUrl: "/food11.jpg",
                isAvailable: true,
                category: "現烤土司"
            },
            {
                name: "總匯土司",
                description: "火腿、蛋、生菜、起司層層堆疊，豐富口感超滿足。",
                price: 55,
                imageUrl: "/food12.jpg",
                isAvailable: true,
                category: "現烤土司"
            },
            {
                name: "鮪魚土司",
                description: "特調鮪魚沙拉搭配新鮮吐司，滑順鮮美好滋味。",
                price: 45,
                imageUrl: "/food13.jpg",
                isAvailable: true,
                category: "現烤土司"
            },
            {
                name: "玉米蛋土司",
                description: "香甜玉米與嫩蛋的完美搭配，營養美味兼具。",
                price: 40,
                imageUrl: "/food14.jpg",
                isAvailable: true,
                category: "現烤土司"
            },
            {
                name: "巧克力香蕉土司",
                description: "香濃巧克力醬加上新鮮香蕉，甜點系吐司好選擇。",
                price: 50,
                imageUrl: "/food15.jpg",
                isAvailable: true,
                category: "現烤土司"
            },
            {
                name: "起司薯餅土司",
                description: "酥脆薯餅與濃郁起司結合，熱壓後外酥內Q，口感十足。",
                price: 50,
                imageUrl: "/food16.jpg",
                isAvailable: true,
                category: "現烤土司"
            },
            // 營養蛋餅
            {
                name: "經典蛋餅",
                description: "香煎蛋餅搭配醬油膏與胡椒，酥脆外皮包覆滑嫩蛋香。",
                price: 35,
                imageUrl: "/food17.jpg",
                isAvailable: true,
                category: "營養蛋餅"
            },
            {
                name: "起司蛋餅",
                description: "香濃起司與蛋的完美結合，口感豐富。",
                price: 40,
                imageUrl: "/food18.jpg",
                isAvailable: true,
                category: "營養蛋餅"
            },
            {
                name: "玉米蛋餅",
                description: "甜甜玉米粒與嫩蛋搭配，滋味香甜可口。",
                price: 40,
                imageUrl: "/food19.jpg",
                isAvailable: true,
                category: "營養蛋餅"
            },
            {
                name: "培根蛋餅",
                description: "酥脆培根搭配煎蛋餅皮，香氣四溢。",
                price: 45,
                imageUrl: "/food20.jpg",
                isAvailable: true,
                category: "營養蛋餅"
            },
            {
                name: "火腿蛋餅",
                description: "經典火腿與蛋的搭配，簡單卻耐吃。",
                price: 40,
                imageUrl: "/food21.jpg",
                isAvailable: true,
                category: "營養蛋餅"
            },
            {
                name: "鮪魚蛋餅",
                description: "特調鮪魚餡料配上香煎蛋餅，滑順又有層次。",
                price: 45,
                imageUrl: "/food22.jpg",
                isAvailable: true,
                category: "營養蛋餅"
            },
            {
                name: "泡菜蛋餅",
                description: "韓式泡菜與蛋餅的微辣組合，刺激味蕾超開胃。",
                price: 45,
                imageUrl: "/food23.jpg",
                isAvailable: true,
                category: "營養蛋餅"
            },
            {
                name: "總匯蛋餅",
                description: "內含火腿、玉米、起司與蛋，一次滿足多種口味。",
                price: 50,
                imageUrl: "/food24.jpg",
                isAvailable: true,
                category: "營養蛋餅"
            },
            // 飲料類
            {
                name: "奶茶（中杯）",
                description: "香濃紅茶加上新鮮牛奶，早晨的最佳拍檔。",
                price: 25,
                imageUrl: "/food25.jpg",
                isAvailable: true,
                category: "飲料類"
            },
            {
                name: "美式咖啡",
                description: "使用精選咖啡豆，香醇濃郁的經典美式咖啡。",
                price: 35,
                imageUrl: "/food26.jpg",
                isAvailable: true,
                category: "飲料類"
            },
            {
                name: "鮮奶茶（大杯）",
                description: "嚴選紅茶與濃純鮮奶，濃郁順口更滿足。",
                price: 35,
                imageUrl: "/food27.jpg",
                isAvailable: true,
                category: "飲料類"
            },
            {
                name: "豆漿",
                description: "現磨黃豆熬製，香濃不甜膩，營養滿分。",
                price: 20,
                imageUrl: "/food28.jpg",
                isAvailable: true,
                category: "飲料類"
            },
            {
                name: "紅茶（中杯）",
                description: "回甘不澀的經典紅茶，冰熱皆宜。",
                price: 20,
                imageUrl: "/food29.jpg",
                isAvailable: true,
                category: "飲料類"
            },
            {
                name: "拿鐵咖啡",
                description: "濃縮咖啡搭配香滑鮮奶，口感柔和層次豐富。",
                price: 45,
                imageUrl: "/food30.jpg",
                isAvailable: true,
                category: "飲料類"
            },
            {
                name: "檸檬紅茶",
                description: "紅茶與鮮檸檬交織的清新風味，夏日首選。",
                price: 30,
                imageUrl: "/food31.jpg",
                isAvailable: true,
                category: "飲料類"
            },
            {
                name: "巧克力牛奶",
                description: "香濃可可與新鮮牛奶完美融合，大人小孩都喜歡。",
                price: 35,
                imageUrl: "/food32.jpg",
                isAvailable: true,
                category: "飲料類"
            },
            // 套餐類
            {
                name: "經典早餐套餐",
                description: "包含蛋餅、飲料和水果，營養均衡。",
                price: 75,
                imageUrl: "/food33.jpg",
                isAvailable: true,
                category: "套餐類"
            },
            {
                name: "豪華早餐套餐",
                description: "包含漢堡、薯條和飲料，份量十足。",
                price: 95,
                imageUrl: "/food34.jpg",
                isAvailable: true,
                category: "套餐類"
            }
        ];

        const createdMenu = await prisma.menuItem.createMany({
            data: menuItems
        });

        return NextResponse.json({
            message: "菜單項目創建成功",
            count: createdMenu.count
        });
    } catch (error) {
        console.error("創建菜單項目失敗:", error);
        return NextResponse.json(
            { message: "創建菜單項目失敗", error: String(error) },
            { status: 500 }
        );
    }
} 