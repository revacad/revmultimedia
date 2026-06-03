import Image from 'next/image'
import { publicSectionClass } from '@/lib/public-ui'
import { cn } from '@/lib/utils'

export default function TestimonialsSection() {
  return (
    <section className={cn('reveal-section', publicSectionClass.white)}>
      <p className="section-label">Testimonials</p>
      <h2 className="section-headline mt-2 font-display text-4xl font-bold text-[#1A1A2E]">
        What our students say
      </h2>
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            name: 'Ama K.',
            course: 'Graphic Design',
            border: 'border-primary',
            quote: 'The structure changed how I approach client work.',
            avatar: '/alumni/pers5.jpg',
          },
          {
            name: 'Kwesi M.',
            course: 'Motion Graphics',
            border: 'border-secondary',
            quote: 'Real projects, real feedback. Exactly what I needed.',
            avatar: '/alumni/pers6.jpg',
          },
          {
            name: 'Efua T.',
            course: 'Video Editing',
            border: 'border-accent',
            quote: 'I finally feel confident charging professional rates.',
            avatar: '/alumni/pers7.jpg',
          },
        ].map((t) => (
          <article
            key={t.name}
            className={cn('rounded-2xl border-t-[3px] bg-surface p-6 shadow-card', t.border)}
          >
            <div className="flex items-center gap-3">
              <Image
                src={t.avatar}
                alt={`${t.name}, ${t.course} student testimonial at Rev Multimedia Ghana`}
                width={40}
                height={40}
                sizes="40px"
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-dark">{t.name}</p>
                <p className="text-sm text-gray-600">{t.course}</p>
              </div>
            </div>
            <p className="mt-4 text-base leading-relaxed text-gray-600">&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-4 inline-flex gap-0.5 text-sm text-yellow-400" aria-label="5 out of 5 stars">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} aria-hidden="true">
                  &#9733;
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
