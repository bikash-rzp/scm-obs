import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { 
  handlers: { GET, POST },
  auth, 
  signIn, 
  signOut
} = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    // Only allow sign-in with @razorpay.com emails
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;
      
      return user?.email?.endsWith("@razorpay.com") ?? false;
    },
    // Add user info to session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  }
}); 