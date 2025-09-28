import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Pass the access token to the session for Google Drive API calls
      session.accessToken = token.accessToken as string;
      return session;
    },
    async jwt({ token, account }) {
      // Store the access token from Google in the JWT token
      if (account && account.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: '/', // Redirect to homepage for sign-in
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };