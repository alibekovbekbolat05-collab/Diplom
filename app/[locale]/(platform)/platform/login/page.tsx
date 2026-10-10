import { LoginForm } from "@/components/platform/login-form";
export const metadata = { robots: { index: false, follow: false } };
export default function Login() {
  return <LoginForm demoEnabled={process.env.DEMO_MODE_ENABLED !== "0"} />;
}
