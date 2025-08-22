import { DynamicWidget } from "@/lib/dynamic";
import Image from "next/image";
import { openExternalLink } from "@/lib/utils";

export default function Nav() {
  return (
    <div className="absolute top-0 flex items-center justify-between w-full p-4 border-b border-gray-200 dark:border-gray-700">
      <Image
        className="h-8 pl-4 object-contain"
        src="/logo-dark.png"
        alt="dynamic"
        width="300"
        height="60"
      />
      <div className="flex gap-3 pr-4">
        <DynamicWidget />

        <button
          className="px-3 py-1.5 rounded-lg border font-medium text-sm transition-all duration-300 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white"
          onClick={() => openExternalLink("https://docs.dynamic.xyz")}
        >
          Docs
        </button>
        <button
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium text-sm transition-colors duration-300 hover:bg-blue-700"
          onClick={() => openExternalLink("https://app.dynamic.xyz")}
        >
          Get started
        </button>
      </div>
    </div>
  );
}
