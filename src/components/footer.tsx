import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-row items-center justify-between gap-6 py-12 px-8">
        <p className="text-center text-sm text-muted-foreground">
          Made with 💙 by{" "}
          <Link
            href="https://dynamic.xyz"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4 hover:text-foreground"
          >
            Dynamic
          </Link>
          . The source code is available on{" "}
          <Link
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4 hover:text-foreground"
          >
            GitHub
          </Link>
          .
        </p>
        <Link
          href="https://dynamic.xyz/join-slack"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Support
        </Link>
      </div>
    </footer>
  );
}
