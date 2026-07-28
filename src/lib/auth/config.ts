import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import Nodemailer from 'next-auth/providers/nodemailer';
import { config } from '@/lib/config';
import { userRepository } from '@/lib/db/repositories/user.repository';
import { db } from '@/lib/db';
import { verificationTokens } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: config.auth.enabled
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          allowDangerousEmailAccountLinking: true,
        }),
        Nodemailer({
          server: {
            host: process.env.EMAIL_SERVER_HOST,
            port: Number(process.env.EMAIL_SERVER_PORT),
            auth: {
              user: process.env.EMAIL_SERVER_USER,
              pass: process.env.EMAIL_SERVER_PASSWORD,
            },
          },
          from: process.env.EMAIL_FROM,
        }),
      ]
    : [
        Credentials({
          name: 'Fingerprint',
          credentials: {
            fingerprint: { label: 'Fingerprint', type: 'text' },
          },
          async authorize(credentials) {
            const fingerprint = credentials?.fingerprint as string;
            if (!fingerprint) return null;
            return {
              id: `fp_${fingerprint}`,
              name: 'Anonymous User',
            };
          },
        }),
      ],
  adapter: {
    async createVerificationToken(data: { identifier: string; token: string; expires: Date }) {
      return await db.insert(verificationTokens).values(data).returning().get();
    },
    async useVerificationToken({ identifier, token }: { identifier: string; token: string }) {
      const result = await db.select().from(verificationTokens).where(
        and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.token, token))
      ).get();
      if (result) {
        await db.delete(verificationTokens).where(
          and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.token, token))
        );
      }
      return result || null;
    },
    async getUserByEmail(email: string) {
      const user = await userRepository.findByEmail(email);
      if (!user) return null;
      return { id: user.id, email: user.email!, emailVerified: null };
    },
    async createUser(user: { email: string }) {
      let dbUser = await userRepository.findByEmail(user.email);
      if (!dbUser) {
        dbUser = await userRepository.create({ email: user.email, authType: 'oauth' });
      }
      return { id: dbUser!.id, email: dbUser!.email!, emailVerified: null };
    },
    async getUser(id: string) {
      const user = await userRepository.findById(id);
      if (!user) return null;
      return { id: user.id, email: user.email!, emailVerified: null };
    },
    async updateUser(user: { id: string }) {
      const dbUser = await userRepository.findById(user.id);
      if (dbUser) {
        return { id: dbUser.id, email: dbUser.email!, emailVerified: new Date() };
      }
      return user;
    },
    async linkAccount(account: Record<string, unknown>) {
      return account;
    },
    async getUserByAccount() {
      return null;
    },
  } as unknown as import('next-auth/adapters').Adapter,
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // First sign-in via Google or Nodemailer: create DB user immediately
      if (user && (account?.provider === 'google' || account?.provider === 'nodemailer')) {
        const email = (profile?.email || user.email) as string;
        const name = (profile?.name || user.name) as string | undefined;
        const avatar = ((profile as { picture?: string })?.picture || user.image) as string | undefined;

        let dbUser = email ? await userRepository.findByEmail(email) : null;
        if (!dbUser) {
          dbUser = await userRepository.create({
            email: email || undefined,
            name,
            avatarUrl: avatar,
            authType: 'oauth',
          });
        }
        // Use stable DB user ID in the token
        if (dbUser) {
          token.userId = dbUser.id;
        }
        token.name = name || dbUser?.name;
        token.email = email;
        token.picture = avatar || dbUser?.avatarUrl;
      }

      // Credentials (fingerprint) mode
      if (user && !account?.provider) {
        token.userId = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId || token.sub) as string;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.AUTH_SECRET,
});
