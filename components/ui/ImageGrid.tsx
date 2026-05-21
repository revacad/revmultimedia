import Image from 'next/image'

interface ImageGridProps {
  images: { url: string; alt?: string; caption?: string }[]
  columns?: 2 | 3
}

export function ImageGrid({ images, columns = 2 }: ImageGridProps) {
  if (images.length === 0) return null

  return (
    <div className={`image-grid ${columns === 3 ? 'image-grid-3' : ''}`}>
      {images.map((image, i) => (
        <div key={i} style={{ position: 'relative' }}>
          <Image
            src={image.url}
            alt={image.alt || ''}
            width={400}
            height={200}
            sizes={
              columns === 3
                ? '(max-width: 768px) 100vw, 33vw'
                : '(max-width: 768px) 100vw, 50vw'
            }
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              borderRadius: '10px',
            }}
            unoptimized={image.url.startsWith('http')}
          />
          {image.caption && (
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#9898B8',
                textAlign: 'center',
                marginTop: '6px',
              }}
            >
              {image.caption}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
