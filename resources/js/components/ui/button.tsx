import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * `loading` cobre o estado de envio inteiro: desabilita, anuncia `aria-busy`
 * e mostra o indicador. Antes disto, `disabled={processing}` deixava o botão
 * só esmaecido — mudo para leitor de tela, que não tem como saber se o clique
 * pegou.
 *
 * Divergência deliberada da origem (ctfinance `ui/button.tsx:60,82`): lá,
 * sob `asChild`, o `disabled` real é suprimido e sobra só `aria-disabled`.
 * Aqui não: `aria-disabled` é anúncio, não impedimento, e o único call site
 * destrutivo com `asChild` era o "Excluir Conta" — que voltaria a aceitar
 * clique durante o envio.
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
    /** Substitui o rótulo enquanto envia. Sem ele, o rótulo original fica. */
    loadingText?: string
  }) {
  const Comp = asChild ? Slot : "button"
  const isDisabled = disabled || loading

  /*
   * O Slot clona um único filho — injetar o indicador aqui daria dois nós e
   * quebraria o call site. Sob `asChild`, quem monta o conteúdo é ele.
   */
  const showsIndicator = loading && !asChild

  return (
    <Comp
      data-slot="button"
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isDisabled || undefined}
      {...props}
    >
      {showsIndicator ? (
        <>
          {/*
            * Sem `aria-hidden` escrito: o lucide-react já o injeta quando o
            * ícone não recebe prop de a11y própria. Quem garante o resultado
            * é o teste, não esta linha — o rótulo do botão já diz tudo, e um
            * ícone anunciado por cima dele seria eco.
            */}
          <LoaderCircle data-slot="button-loading-icon" className="size-4 animate-spin" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
