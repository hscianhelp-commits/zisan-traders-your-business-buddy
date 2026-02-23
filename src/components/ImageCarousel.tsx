import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  autoScrollInterval?: number;
}

export default function ImageCarousel({ images, autoScrollInterval = 3000 }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (images.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoScrollInterval);
    return () => clearInterval(intervalRef.current);
  }, [images.length, autoScrollInterval]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: currentIndex * scrollRef.current.offsetWidth,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
      if (index !== currentIndex) {
        setCurrentIndex(index);
        // Reset auto-scroll timer on manual scroll
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % images.length);
        }, autoScrollInterval);
      }
    }
  };

  if (images.length === 0) return null;

  return (
    <>
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
        >
          {images.map((img, i) => (
            <div
              key={i}
              className="w-full shrink-0 snap-center cursor-pointer"
              onClick={() => {
                setFullscreen(true);
                setCurrentIndex(i);
              }}
            >
              <img
                src={img}
                alt=""
                className="w-full aspect-video object-cover rounded-lg pointer-events-auto"
                style={{ pointerEvents: "auto" }}
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === currentIndex ? "bg-primary w-3" : "bg-primary/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={() => setFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white z-10 bg-white/20 rounded-full p-2"
            onClick={() => setFullscreen(false)}
          >
            <X size={20} />
          </button>
          
          {images.length > 1 && (
            <>
              <button
                className="absolute left-2 z-10 text-white bg-white/20 rounded-full p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
                }}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                className="absolute right-2 z-10 text-white bg-white/20 rounded-full p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev + 1) % images.length);
                }}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <img
            src={images[currentIndex]}
            alt=""
            className="max-w-full max-h-full object-contain pointer-events-auto"
            style={{ pointerEvents: "auto" }}
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
