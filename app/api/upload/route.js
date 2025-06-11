import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req) {
    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase credentials");
        return NextResponse.json(
            { success: false, error: "Server configuration error" },
            { status: 500 }
        );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file || typeof file === "string") {
            return NextResponse.json(
                { success: false, error: "No file uploaded" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}_${file.name}`;

        // 上傳到 Supabase Storage
        const { data, error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            return NextResponse.json(
                { success: false, error: uploadError.message },
                { status: 500 }
            );
        }

        // 獲取公開 URL
        const { data: urlData } = supabase.storage
            .from('uploads')
            .getPublicUrl(data.path);

        if (!urlData?.publicUrl) {
            throw new Error("Failed to get public URL");
        }

        return NextResponse.json(
            { success: true, url: urlData.publicUrl },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to upload file" },
            { status: 500 }
        );
    }
}
