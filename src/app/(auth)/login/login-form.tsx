"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, AlertCircle, ArrowRight, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        username: data.username,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid username or password. Please try again.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Mobile logo — only visible on small screens */}
      <div className="flex items-center gap-2.5 mb-8 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
          <Boxes className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-foreground">ICL Inventory</span>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Username */}
        <div className="space-y-1.5">
          <label htmlFor="username" className="block text-sm font-medium text-foreground">
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            disabled={isLoading}
            placeholder="Enter your username"
            {...register("username")}
            className={cn(
              "block w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60",
              "shadow-sm transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              errors.username
                ? "border-red-300 focus:ring-red-300/30 focus:border-red-400"
                : "border-border/70 hover:border-border"
            )}
          />
          {errors.username && (
            <p className="text-xs text-red-600">{errors.username.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isLoading}
              placeholder="Enter your password"
              {...register("password")}
              className={cn(
                "block w-full rounded-xl border bg-white px-4 py-2.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground/60",
                "shadow-sm transition-all duration-150",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                errors.password
                  ? "border-red-300 focus:ring-red-300/30 focus:border-red-400"
                  : "border-border/70 hover:border-border"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword
                ? <EyeOff className="h-4 w-4" />
                : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white",
            "bg-indigo-600 shadow-md shadow-indigo-500/25",
            "transition-all duration-150",
            "hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-px",
            "active:scale-[0.98] active:translate-y-0",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
            "disabled:opacity-60 disabled:pointer-events-none"
          )}
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
