export interface Quote {
  text: string
  name: string
  title: string
  image: string
}

export const creativeQuotes: Quote[] = [
  {
    text: "I didn't get into design to be an artist. Being a designer goes a step further — not only trying to evoke emotion but trying to make a reaction.",
    name: 'Gideon Kutsinyah',
    title: 'Founder & Creative Director, Motivo Limited',
    image: '/images/quotes/Gideon.webp',
  },
  {
    text: 'Good code and good design are the same thing — both should be invisible, effortless, and precisely right.',
    name: 'Batista Simons',
    title: 'Founder, Cimons Technologies',
    image: '/images/quotes/Batista.webp',
  },
  {
    text: 'Design is not just what it looks like and feels like. Design is how it works.',
    name: 'Steve Jobs',
    title: 'Co-founder, Apple',
    image: '/images/quotes/steve.webp',
  },
  {
    text: 'The details are not the details. They make the design.',
    name: 'Charles Eames',
    title: 'Designer & Architect',
    image: '/images/quotes/charles-eames.webp',
  },
  {
    text: 'Good design is obvious. Great design is transparent.',
    name: 'Joe Sparano',
    title: 'Graphic Designer',
    image: '/images/quotes/joe-sparano.webp',
  },
  {
    text: 'Every frame tells a story. My job is to make sure it is the right one.',
    name: 'Godfred Ferdinand Appiah',
    title: 'Lead Instructor, Rev Multimedia',
    image: '/images/quotes/Godfred.webp',
  },
]

export function pickRandomQuote(): Quote {
  return creativeQuotes[Math.floor(Math.random() * creativeQuotes.length)]
}
