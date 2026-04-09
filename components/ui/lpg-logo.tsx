import Image from "next/image"
import { cn } from "@/lib/utils"

interface LPGLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-8 w-8",
}

export function LPGLogo({ className, size = "md" }: LPGLogoProps) {
  return (
    <Image
      src="/lpg-logo.jpg"
      alt="LPG Cylinder"
      width={32}
      height={32}
      className={cn(sizeMap[size], "object-contain", className)}
    />
  )
}
