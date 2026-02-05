import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="container flex min-h-screen min-w-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold">Welcome</CardTitle>
          <CardDescription>
            Please sign in or create an account to continue.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <Button asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/auth/signup">Sign Up</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
