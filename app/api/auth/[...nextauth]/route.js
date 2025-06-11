import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
        GithubProvider({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email }
                    });

                    if (!user || user.password !== credentials.password) {
                        return null;
                    }

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    };
                } catch (error) {
                    console.error("認證錯誤:", error);
                    return null;
                }
            }
        })
    ],
    pages: {
        signIn: '/login',
        error: '/login',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                try {
                    // 檢查用戶是否已存在
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email }
                    });

                    if (!existingUser) {
                        // 根據 email 判斷用戶角色
                        let role = "CUSTOMER";
                        if (user.email === "owner@test.com") {
                            role = "OWNER";
                        } else if (user.email === "staff@test.com") {
                            role = "STAFF";
                        } else if (user.email === "chef@test.com") {
                            role = "CHEF";
                        } else if (user.email === "captain@test.com") {
                            role = "CAPTAIN";
                        }

                        // 創建新用戶
                        const newUser = await prisma.user.create({
                            data: {
                                email: user.email,
                                name: user.name,
                                password: "google-auth", // 設置一個默認密碼
                                role: role,
                            }
                        });
                        user.id = newUser.id;
                        user.role = newUser.role;
                    } else {
                        user.id = existingUser.id;
                        user.role = existingUser.role;
                    }
                    return true;
                } catch (error) {
                    console.error("Google 登入錯誤:", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.role = token.role;
                session.user.id = token.id;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET || "your-fallback-secret-key",
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };
