import Image from 'next/image'
import type { Quote } from '@/lib/quotes'

interface ApplyQuoteCardProps {
  quote: Quote
}

export default function ApplyQuoteCard({ quote }: ApplyQuoteCardProps) {
  return (
    <figure className="mt-8 sm:mt-10">
      <blockquote>
        <p className="font-display text-[17px] font-medium leading-relaxed text-[#1A1A2E] sm:text-lg">
          &ldquo;{quote.text}&rdquo;
        </p>
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-primary/40 sm:h-11 sm:w-11">
          <Image
            src={quote.image}
            alt={quote.name}
            width={44}
            height={44}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="font-body text-sm font-bold text-[#1A1A2E]">{quote.name}</p>
          <p className="font-body text-xs text-[#5A5A7A]">{quote.title}</p>
        </div>
      </figcaption>
    </figure>
  )
}
